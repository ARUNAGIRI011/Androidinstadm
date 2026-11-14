import { findProductForMessage, type ProductLink } from "./product-catalog.js";
import { sendInstagramText, type InstagramSendConfig } from "./instagram-send.js";
export interface InstagramMessageEvent { senderId: string; messageId: string; text: string; timestamp: number; isEcho: boolean; }
export function extractInstagramMessages(payload: unknown): InstagramMessageEvent[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as { object?: unknown; entry?: unknown };
  if (root.object !== "instagram" || !Array.isArray(root.entry)) return [];
  const events: InstagramMessageEvent[] = [];
  for (const entry of root.entry) {
    if (!entry || typeof entry !== "object") continue;
    const messaging = (entry as { messaging?: unknown }).messaging;
    if (!Array.isArray(messaging)) continue;
    for (const item of messaging) {
      if (!item || typeof item !== "object") continue;
      const e = item as { sender?: { id?: unknown }; timestamp?: unknown; message?: { mid?: unknown; text?: unknown; is_echo?: unknown } };
      const m = e.message;
      if (typeof e.sender?.id !== "string" || typeof m?.mid !== "string" || typeof m.text !== "string" || typeof e.timestamp !== "number") continue;
      events.push({ senderId: e.sender.id, messageId: m.mid, text: m.text, timestamp: e.timestamp, isEcho: m.is_echo === true });
    }
  }
  return events;
}
export interface ProcessMessageOptions { catalog: ProductLink[]; sendConfig: InstagramSendConfig; maxAgeHours: number; now?: number; fetchImpl?: typeof fetch; }
export async function processInstagramMessage(event: InstagramMessageEvent, options: ProcessMessageOptions): Promise<"ignored" | "no-product-match" | "sent"> {
  const age = (options.now ?? Date.now()) - event.timestamp;
  if (event.isEcho || !event.text.trim() || !event.senderId || !event.messageId) return "ignored";
  if (age < -60_000 || age > options.maxAgeHours * 3_600_000) return "ignored";
  const product = findProductForMessage(event.text, options.catalog);
  if (!product) return "no-product-match";
  await sendInstagramText(options.sendConfig, event.senderId, `Here is the ${product.title} product page you asked for: ${product.url}`, options.fetchImpl);
  return "sent";
}
