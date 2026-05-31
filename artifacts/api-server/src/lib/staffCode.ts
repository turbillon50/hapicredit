export function isValidStaffCode(submitted: unknown): boolean {
  if (typeof submitted !== "string" || submitted.length === 0) return false;

  const envCode = process.env.STAFF_MASTER_CODE;
  if (envCode) return submitted === envCode;

  // Local/dev fallback only. Production must set STAFF_MASTER_CODE in Vercel.
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) return false;
  return submitted === "credite" || submitted === "credeti";
}
