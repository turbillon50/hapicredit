// Web Push (VAPID) helper.
//
// Keys come from VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY env vars when present.
// If absent, keys are auto-generated once and persisted in the app_settings
// table, so push works with zero extra ops configuration.
import webpush from "web-push";
import { pool } from "@workspace/db";
import { logger } from "./logger";

type VapidKeys = { publicKey: string; privateKey: string };

let ready: Promise<VapidKeys> | null = null;

async function ensure(): Promise<VapidKeys> {
  if (!ready) {
    ready = (async () => {
      await pool.query(
        `CREATE TABLE IF NOT EXISTS app_settings (key text PRIMARY KEY, value text NOT NULL)`,
      );
      await pool.query(
        `CREATE TABLE IF NOT EXISTS push_subscriptions (
           id serial PRIMARY KEY,
           user_id integer NOT NULL REFERENCES users(id),
           endpoint text NOT NULL UNIQUE,
           p256dh text NOT NULL,
           auth text NOT NULL,
           created_at timestamptz NOT NULL DEFAULT now()
         )`,
      );

      let publicKey = process.env.VAPID_PUBLIC_KEY;
      let privateKey = process.env.VAPID_PRIVATE_KEY;

      if (!publicKey || !privateKey) {
        const read = async () => {
          const r = await pool.query<{ key: string; value: string }>(
            `SELECT key, value FROM app_settings WHERE key IN ('vapid_public_key','vapid_private_key')`,
          );
          const map = Object.fromEntries(r.rows.map(x => [x.key, x.value]));
          return { publicKey: map.vapid_public_key, privateKey: map.vapid_private_key };
        };
        let stored = await read();
        if (!stored.publicKey || !stored.privateKey) {
          const keys = webpush.generateVAPIDKeys();
          await pool.query(
            `INSERT INTO app_settings (key, value) VALUES ('vapid_public_key',$1),('vapid_private_key',$2)
             ON CONFLICT (key) DO NOTHING`,
            [keys.publicKey, keys.privateKey],
          );
          stored = await read(); // re-read to win any cold-start race
        }
        publicKey = stored.publicKey;
        privateKey = stored.privateKey;
      }

      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT ?? "mailto:noreply@crede-ti.info",
        publicKey!,
        privateKey!,
      );
      return { publicKey: publicKey!, privateKey: privateKey! };
    })().catch(err => {
      ready = null;
      throw err;
    });
  }
  return ready;
}

export async function getVapidPublicKey(): Promise<string> {
  return (await ensure()).publicKey;
}

export async function saveSubscription(
  userId: number,
  sub: { endpoint: string; p256dh: string; auth: string },
): Promise<void> {
  await ensure();
  await pool.query(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (endpoint) DO UPDATE SET user_id = $1, p256dh = $3, auth = $4`,
    [userId, sub.endpoint, sub.p256dh, sub.auth],
  );
}

export async function removeSubscription(endpoint: string): Promise<void> {
  await ensure();
  await pool.query(`DELETE FROM push_subscriptions WHERE endpoint = $1`, [endpoint]);
}

export type PushPayload = { title: string; body: string; url?: string };

// Best-effort: never throws. Cleans up expired (410/404) subscriptions.
export async function sendPushToUsers(userIds: number[], payload: PushPayload): Promise<void> {
  if (userIds.length === 0) return;
  try {
    await ensure();
    const r = await pool.query<{ endpoint: string; p256dh: string; auth: string }>(
      `SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ANY($1::int[])`,
      [userIds],
    );
    await Promise.allSettled(
      r.rows.map(async row => {
        try {
          await webpush.sendNotification(
            { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
            JSON.stringify(payload),
          );
        } catch (err: unknown) {
          const code = (err as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) {
            await pool.query(`DELETE FROM push_subscriptions WHERE endpoint = $1`, [row.endpoint]).catch(() => {});
          }
        }
      }),
    );
  } catch (err) {
    logger.warn({ err }, "push: send failed");
  }
}

export async function sendPushToAdmins(payload: PushPayload): Promise<void> {
  try {
    await ensure();
    const r = await pool.query<{ id: number }>(
      `SELECT id FROM users WHERE role = 'admin' AND is_active = true AND deleted_at IS NULL`,
    );
    await sendPushToUsers(r.rows.map(x => x.id), payload);
  } catch (err) {
    logger.warn({ err }, "push: admin broadcast failed");
  }
}

// Ops links client records to user accounts by full name (same convention as
// the credit-decision emails). Best-effort by design.
export async function sendPushToClientByName(fullName: string, payload: PushPayload): Promise<void> {
  try {
    await ensure();
    const r = await pool.query<{ id: number }>(
      `SELECT id FROM users WHERE full_name = $1 AND deleted_at IS NULL LIMIT 5`,
      [fullName],
    );
    await sendPushToUsers(r.rows.map(x => x.id), payload);
  } catch (err) {
    logger.warn({ err }, "push: client send failed");
  }
}
