export function isValidStaffCode(submitted: unknown): boolean {
  if (typeof submitted !== "string" || submitted.length === 0) return false;

  const envCode = process.env.STAFF_MASTER_CODE;
  // SEGURIDAD: en produccion SOLO se acepta la clave maestra del entorno.
  // El alias "credeti" (adivinable) queda BLOQUEADO en produccion para que
  // nadie pueda auto-promoverse a admin escribiendo el nombre de la app.
  if (envCode) return submitted === envCode;

  // Sin env configurada: solo en desarrollo local se permite el alias legacy.
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) return false;
  return submitted === "credeti";
}

/**
 * Validates the superadmin (Luis) code — completely separate from the
 * business-admin STAFF_MASTER_CODE.  In production set SUPERADMIN_CODE in
 * Vercel env vars.  Locally/dev falls back to the hardcoded default only when
 * not in production.
 */
export function isValidSuperadminCode(submitted: unknown): boolean {
  if (typeof submitted !== "string" || submitted.length === 0) return false;

  const envCode = process.env.SUPERADMIN_CODE;
  if (envCode) return submitted === envCode;

  // Production/Vercel requires the env var — never accept a hardcoded default.
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) return false;

  return submitted === "LuisAdmin2025#";
}
