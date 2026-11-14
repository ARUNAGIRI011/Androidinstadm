export interface InstagramSendConfig { apiBaseUrl: string; apiVersion: string; accountId: string; accessToken: string; }
export async function sendInstagramText(config: InstagramSendConfig, recipientId: string, text: string, fetchImpl: typeof fetch = fetch): Promise<void> {
  const base = new URL(config.apiBaseUrl);
  if (base.protocol !== "https:" || !["graph.instagram.com", "graph.facebook.com"].includes(base.hostname)) throw new Error("META_GRAPH_API_BASE_URL must be an official Meta Graph API HTTPS host");
  if (!/^v\d+\.\d+$/.test(config.apiVersion)) throw new Error("Invalid Meta Graph API version");
  if (!config.accountId || !config.accessToken) throw new Error("Instagram account ID/token not configured");
  const endpoint = new URL(`/${config.apiVersion}/${encodeURIComponent(config.accountId)}/messages`, base);
  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: { authorization: `Bearer ${config.accessToken}`, "content-type": "application/json" },
    body: JSON.stringify({ recipient: { id: recipientId }, message: { text } }),
    signal: AbortSignal.timeout(15_000)
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Meta Send API failed with HTTP ${response.status}: ${detail.slice(0, 300)}`);
  }
}
