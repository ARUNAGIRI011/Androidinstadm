import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { verifyMetaSignature } from "./meta-signature.js";

test("accepts a valid Meta SHA-256 signature", () => {
  const body = Buffer.from(JSON.stringify({ object: "instagram" }));
  const secret = "test-secret";
  const signature = "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
  assert.equal(verifyMetaSignature(body, signature, secret), true);
});

test("rejects missing, malformed, and incorrect signatures", () => {
  const body = Buffer.from("{}");
  assert.equal(verifyMetaSignature(body, undefined, "secret"), false);
  assert.equal(verifyMetaSignature(body, "sha1=abcd", "secret"), false);
  assert.equal(verifyMetaSignature(body, "sha256=" + "0".repeat(64), "secret"), false);
});
