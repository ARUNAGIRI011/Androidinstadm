import test from "node:test";
import assert from "node:assert/strict";
import { findProductForMessage, parseProductCatalog } from "./product-catalog.js";
import { extractInstagramMessages, processInstagramMessage } from "./message-processor.js";
const catalog = [{ title: "Blue Shirt", keywords: ["blue shirt", "shirt"], url: "https://shop.example.com/products/blue-shirt" }];
test("loads only HTTPS product links", () => {
  assert.equal(parseProductCatalog(JSON.stringify(catalog)).length, 1);
  assert.throws(() => parseProductCatalog(JSON.stringify([{ ...catalog[0], url: "http://shop.example.com/item" }])));
});
test("matches product keywords case-insensitively", () => {
  assert.equal(findProductForMessage("Do you have a BLUE SHIRT?", catalog)?.title, "Blue Shirt");
  assert.equal(findProductForMessage("hello there", catalog), undefined);
});
test("extracts inbound Instagram text messages and echo markers", () => {
  const events = extractInstagramMessages({ object: "instagram", entry: [{ messaging: [
    { sender: { id: "customer-1" }, timestamp: 1700000000000, message: { mid: "m1", text: "shirt" } },
    { sender: { id: "account" }, timestamp: 1700000000000, message: { mid: "m2", text: "shirt", is_echo: true } }
  ] }] });
  assert.equal(events.length, 2);
  assert.equal(events[1]?.isEcho, true);
});
test("does not send outside the reply window or when no product matches", async () => {
  let calls = 0;
  const fetchImpl: typeof fetch = async () => { calls++; return new Response("{}", { status: 200 }); };
  const event = { senderId: "customer-1", messageId: "m1", text: "shirt", timestamp: 1700000000000, isEcho: false };
  const sendConfig = { apiBaseUrl: "https://graph.instagram.com", apiVersion: "v27.0", accountId: "account-1", accessToken: "test-token" };
  assert.equal(await processInstagramMessage(event, { catalog, sendConfig, maxAgeHours: 24, now: event.timestamp + 25 * 3600000, fetchImpl }), "ignored");
  assert.equal(await processInstagramMessage({ ...event, text: "hello" }, { catalog, sendConfig, maxAgeHours: 24, now: event.timestamp + 1000, fetchImpl }), "no-product-match");
  assert.equal(calls, 0);
});
