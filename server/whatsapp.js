/**
 * WhatsApp text messages through WaSenderAPI. Used for OTPs and order updates.
 *
 * Required:
 *   WASENDER_API_KEY           Session API key from the WaSenderAPI dashboard.
 *
 * Optional:
 *   WASENDER_API_URL           Defaults to https://wasenderapi.com/api/send-message
 *   WHATSAPP_SEND_TIMEOUT_MS   Give up on a send after this long (default 5000).
 */

const DEFAULT_API_URL = 'https://wasenderapi.com/api/send-message';

// `phone` is a 10-digit Indian mobile number.
export async function sendWhatsAppText(phone, text) {
  const apiKey = process.env.WASENDER_API_KEY;
  if (!apiKey) {
    throw new Error('WaSenderAPI key is missing. Add WASENDER_API_KEY to .env');
  }

  const response = await fetch(process.env.WASENDER_API_URL || DEFAULT_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    // WaSenderAPI destination, e.g. 919876543210
    body: JSON.stringify({ to: `91${phone}`, text }),
    // A slow provider must never hold up a checkout or sign-up response.
    signal: AbortSignal.timeout(Number(process.env.WHATSAPP_SEND_TIMEOUT_MS) || 5000),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data?.success === false) {
    const apiMessage = data?.message || data?.error || 'WaSenderAPI rejected the request';
    throw new Error(`WaSenderAPI request failed (${response.status}): ${apiMessage}`);
  }

  return data;
}
