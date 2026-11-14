import "dotenv/config";
import express from "express";
import helmet from "helmet";
import { z } from "zod";
import { verifyMetaSignature } from "./meta-signature.js";
import { EventStore } from "./event-store.js";
import { extractInstagramMessages, processInstagramMessage } from "./message-processor.js";
import { parseProductCatalog } from "./product-catalog.js";

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().int().positive().default(8080),
  META_APP_SECRET: z.string().optional(),
  META_WEBHOOK_VERIFY_TOKEN: z.string().optional(),
  META_GRAPH_API_VERSION: z.string().default("v27.0"),
  META_GRAPH_API_BASE_URL: z.string().url().default("https://graph.instagram.com"),
  INSTAGRAM_ACCOUNT_ID: z.string().optional(),
  INSTAGRAM_ACCESS_TOKEN: z.string().optional(),
  PRODUCT_LINKS_JSON: z.string().default("[]"),
  DATABASE_PATH: z.string().default("./data/androidinstadm.sqlite"),
  AUTO_REPLY_ENABLED: z.enum(["true", "false"]).default("false").transform((v) => v === "true"),
  MAX_MESSAGE_AGE_HOURS: z.coerce.number().positive().max(24).default(24)
});

const env = envSchema.parse(process.env);
const catalog = parseProductCatalog(env.PRODUCT_LINKS_JSON);

if (env.AUTO_REPLY_ENABLED) {
  const required = [
    env.META_APP_SECRET,
    env.META_WEBHOOK_VERIFY_TOKEN,
    env.INSTAGRAM_ACCOUNT_ID,
    env.INSTAGRAM_ACCESS_TOKEN
  ];
  if (required.some((value) => !value)) {
    throw new Error("AUTO_REPLY_ENABLED requires META_APP_SECRET, META_WEBHOOK_VERIFY_TOKEN, INSTAGRAM_ACCOUNT_ID, and INSTAGRAM_ACCESS_TOKEN");
  }
  if (catalog.length === 0) {
    throw new Error("AUTO_REPLY_ENABLED requires at least one PRODUCT_LINKS_JSON entry");
  }
}

const eventStore = env.AUTO_REPLY_ENABLED ? new EventStore(env.DATABASE_PATH) : undefined;
const app = express();
app.disable("x-powered-by");
app.use(helmet());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "androidinstadm-backend",
    productAutoReplyEnabled: env.AUTO_REPLY_ENABLED,
    productRules: catalog.length
  });
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

// Keep exact raw bytes for X-Hub-Signature-256 validation before parsing JSON.
app.post(
  "/webhooks/meta",
  express.raw({ type: "application/json", limit: "1mb" }),
  async (req, res) => {
    if (!Buffer.isBuffer(req.body) || !env.META_APP_SECRET) {
      return res.sendStatus(503);
    }

    const signature = req.header("x-hub-signature-256");
    if (!verifyMetaSignature(req.body, signature, env.META_APP_SECRET)) {
      return res.sendStatus(401);
    }

    let payload: unknown;
    try {
      payload = JSON.parse(req.body.toString("utf8"));
    } catch {
      return res.sendStatus(400);
    }

    if (!env.AUTO_REPLY_ENABLED || !eventStore) {
      return res.sendStatus(200);
    }

    const messages = extractInstagramMessages(payload);
    let sent = 0;
    let skipped = 0;

    try {
      for (const message of messages) {
        if (!eventStore.claim(message.messageId)) {
          skipped++;
          continue;
        }

        let outcome: "ignored" | "no-product-match" | "sent";
        try {
          outcome = await processInstagramMessage(message, {
          catalog,
          sendConfig: {
            apiBaseUrl: env.META_GRAPH_API_BASE_URL,
            apiVersion: env.META_GRAPH_API_VERSION,
            accountId: env.INSTAGRAM_ACCOUNT_ID!,
            accessToken: env.INSTAGRAM_ACCESS_TOKEN!
          },
            maxAgeHours: env.MAX_MESSAGE_AGE_HOURS
          });
          eventStore.complete(message.messageId, outcome);
        } catch (error) {
          eventStore.release(message.messageId);
          throw error;
        }

        if (outcome === "sent") sent++;
        else skipped++;
      }
    } catch {
      console.error("Meta message processing failed; requesting webhook retry");
      return res.sendStatus(500);
    }

    console.info("Meta webhook processed", { received: messages.length, sent, skipped });
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
