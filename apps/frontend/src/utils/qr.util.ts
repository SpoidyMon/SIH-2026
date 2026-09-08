export interface QrPayload {
  token: string;
  farmerId?: string;
  slotId?: string;
  isAgroviaCode: boolean;
}

/**
 * Parses raw QR code data into a structured payload.
 * Supports:
 * - Agrovia verification URLs: https://agrovia.gov.in/verify?tkn=8SEP-10AM-001&slot=...&farmer=...
 * - JSON encoded strings: {"token": "8SEP-10AM-001", "farmerId": "..."}
 * - Raw token codes: 8SEP-10AM-001, TKN-7821, REQ-123456
 */
export function parseQrPayload(qrData: string): QrPayload {
  if (!qrData) {
    return { token: "", isAgroviaCode: false };
  }

  const trimmed = qrData.trim();

  // 1. Check if JSON payload
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      const token = (parsed.token || parsed.tkn || parsed.bookingId || "").trim();
      if (token) {
        return {
          token,
          farmerId: parsed.farmerId || parsed.farmer,
          slotId: parsed.slotId || parsed.slot,
          isAgroviaCode: true,
        };
      }
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
      const isAgrovia =
        parsedUrl.hostname.includes("agrovia") ||
        parsedUrl.pathname.includes("verify") ||
        parsedUrl.searchParams.has("farmer") ||
        parsedUrl.searchParams.has("slot");
      return {
        token: decodeURIComponent(tkn).trim(),
        farmerId: parsedUrl.searchParams.get("farmer") || undefined,
        slotId: parsedUrl.searchParams.get("slot") || undefined,
        isAgroviaCode: isAgrovia,
      };
    }
  } catch {
    // Not a full valid URL, continue
  }

  // 3. Fallback regex for URLs or query-string like snippets
  const match = trimmed.match(/[?&](?:tkn|token)=([^&#\s]+)/i);
  if (match && match[1]) {
    const farmerMatch = trimmed.match(/[?&]farmer=([^&#\s]+)/i);
    const slotMatch = trimmed.match(/[?&]slot=([^&#\s]+)/i);
    return {
      token: decodeURIComponent(match[1]).trim(),
      farmerId: farmerMatch ? decodeURIComponent(farmerMatch[1]).trim() : undefined,
      slotId: slotMatch ? decodeURIComponent(slotMatch[1]).trim() : undefined,
      isAgroviaCode: true,
    };
  }

  // 4. Raw token pattern check
  const isPatternMatch = isValidAgroviaToken(trimmed);

  return {
    token: trimmed,
    isAgroviaCode: isPatternMatch,
  };
}

/**
 * Checks if a string matches valid Agrovia token formats:
 * - Date format: e.g. 8SEP-10AM-001, 15OCT-2PM-014
 * - TKN format: e.g. TKN-7821, TKN-3190
 * - REQ format: e.g. REQ-981234
 * - UUID or standard 8+ alphanumeric token
 */
export function isValidAgroviaToken(token: string): boolean {
  if (!token || typeof token !== "string") return false;
  const clean = token.trim();

  // e.g. 8SEP-10AM-001 or 12OCT-2PM-005
  if (/^\d{1,2}[A-Z]{3}-\d{1,2}(?:AM|PM)-\d{3}$/i.test(clean)) return true;

  // e.g. TKN-7821, TKN-3190
  if (/^TKN-[A-Z0-9_-]+$/i.test(clean)) return true;

  // e.g. REQ-981234
  if (/^REQ-[A-Z0-9_-]+$/i.test(clean)) return true;

  // Generic 6-36 char alphanumeric token / UUID
  if (/^[A-Za-z0-9_-]{6,36}$/.test(clean)) return true;

  return false;
}

/**
 * Extracts clean token string from raw QR code data.
 */
export function extractTokenFromQrData(qrData: string): string {
  return parseQrPayload(qrData).token;
}
