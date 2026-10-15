/** "01001234567" → "+201001234567". Accepts +20… and 20… as typed too. */
export function toE164(local: string) {
  const digits = local.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("0")) return `+20${digits.slice(1)}`;
  if (digits.startsWith("20")) return `+${digits}`;
  return `+20${digits}`;
}

/** Egyptian mobile in E.164: +20 10/11/12/15 + 8 digits. */
export const isEgyptMobile = (e164: string) => /^\+201[0125]\d{8}$/.test(e164);
