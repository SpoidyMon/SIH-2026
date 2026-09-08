/**
 * Extracts clean token string from raw QR code data.
 * Supports:
 * - Agrovia verification URLs: https://agrovia.gov.in/verify?tkn=8SEP-10AM-001&slot=...
 * - JSON encoded strings: {"token": "8SEP-10AM-001"}
 * - Raw token codes: 8SEP-10AM-001, TKN-7821
 */
export function extractTokenFromQrData(qrData: string): string {
  if (!qrData) return "";
  const trimmed = qrData.trim();

  // 1. Check if JSON payload
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.token && typeof parsed.token === "string") return parsed.token.trim();
      if (parsed.tkn && typeof parsed.tkn === "string") return parsed.tkn.trim();
      if (parsed.bookingId && typeof parsed.bookingId === "string") return parsed.bookingId.trim();
    } catch {
      // Not JSON, continue
    }
  }

  // 2. Check standard URL parsing
  try {
    const parsedUrl = new URL(trimmed);
    const tkn =
      parsedUrl.searchParams.get("tkn") ||
      parsedUrl.searchParams.get("token") ||
      parsedUrl.searchParams.get("id");
    if (tkn) {
      return decodeURIComponent(tkn).trim();
    }
  } catch {
    // Not a full valid URL, continue
  }

  // 3. Fallback regex for URLs or query-string like snippets
  const match = trimmed.match(/[?&](?:tkn|token)=([^&#\s]+)/i);
  if (match && match[1]) {
    return decodeURIComponent(match[1]).trim();
  }

  return trimmed;
}
