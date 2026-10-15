/** wa.me link from a stored phone (+201001234567), with an optional pre-filled message. */
export function whatsappUrl(phone: string, text?: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
