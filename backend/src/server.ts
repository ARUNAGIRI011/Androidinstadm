import "dotenv/config";
import express from "express";
import helmet from "helmet";
import { z } from "zod";
import { verifyMetaSignature } from "./meta-signature.js";

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().int().positive().default(8080),
  META_APP_SECRET: z.string().optional(),
  META_WEBHOOK_VERIFY_TOKEN: z.string().optional(),
  META_WEBHOOK_ALLOWED_FIELDS: z.string().default("messages,messaging_postbacks")
});

const env = envSchema.parse(process.env);
const app = express();
app.disable("x-powered-by");
app.use(helmet());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "androidinstadm-backend" });
});

// Meta webhook verification handshake. Configure this URL in the Meta App Dashboard.
app.get("/webhooks/meta", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (
    mode === "subscribe" &&
    typeof token === "string" &&
    env.META_WEBHOOK_VERIFY_TOKEN &&
    token === env.META_WEBHOOK_VERIFY_TOKEN &&
    typeof challenge === "string"
  ) {
    return res.status(200).type("text/plain").send(challenge);
  }

  return res.sendStatus(403);
});

// Keep the exact raw request bytes for HMAC validation before parsing JSON.
app.post(
  "/webhooks/meta",
  express.raw({ type: "application/json", limit: "1mb" }),
  (req, res) => {
    if (!Buffer.isBuffer(req.body) || !env.META_APP_SECRET) {
      return res.sendStatus(503);
    }

    const signature = req.header("x-hub-signature-256");
    if (!verifyMetaSignature(req.body, signature, env.META_APP_SECRET)) {
      return res.sendStatus(401);
    }

    let event: unknown;
    try {
      event = JSON.parse(req.body.toString("utf8"));
    } catch {
      return res.sendStatus(400);
    }

    // Acknowledge only after signature validation. Durable event storage,
    // deduplication, tenant/account routing, and worker enqueueing are next steps.
    console.info("Verified Meta webhook received", {
      bytes: req.body.length,
      object: typeof event === "object" && event !== null && "object" in event
        ? (event as { object?: unknown }).object
        : undefined
    });
    return res.sendStatus(200);
  }
);

app.use((_req, res) => res.status(404).json({ error: "not_found" }));

if (env.NODE_ENV !== "test") {
  app.listen(env.PORT, "0.0.0.0", () => {
    console.info(`AndroidInstadm backend listening on port ${env.PORT}`);
  });
}

export { app };
