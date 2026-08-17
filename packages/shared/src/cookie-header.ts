export function cookieHeaderWithSessionToken(
  existingCookieHeader: string | null,
  cookieName: string,
  value: string,
): string {
  const parts = (existingCookieHeader ?? "")
    .split(";")
    .map((part) => part.trim())
    .filter((part) => {
      if (!part) return false;
      if (part.startsWith(`${cookieName}=`)) return false;
      if (part.startsWith(`${cookieName}.`)) return false;
      return true;
    });
  parts.push(`${cookieName}=${value}`);
  return parts.join("; ");
}
