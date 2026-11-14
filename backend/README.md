# AndroidInstadm backend

Node.js 22+ / TypeScript / Express. This backend supports a single Instagram professional account in personal-use mode.

## Product-page-only DM automation

The automation is deliberately narrow:
- It processes inbound text messages delivered by Meta's official Instagram Messaging webhooks.
- It sends a reply only when a configured keyword matches a product entry.
- The reply contains only the configured product title and HTTPS product-page URL.
- It does not send general chat replies, cold DMs, bulk campaigns, follow-up sequences, or unsolicited messages.
- It ignores echo events and messages outside the configured reply window.
- SQLite stores message IDs to avoid duplicate replies on webhook retries.
- Automation is disabled unless `AUTO_REPLY_ENABLED=true`.

## Requirements

- Node.js 22.13+.
- Instagram **Professional** account (Business or Creator) supported by the Instagram Messaging API. A normal consumer/personal Instagram account is not eligible for this API.
- A Meta app configured with the Instagram Messaging product and required permissions/access for your chosen login flow.
- A public HTTPS backend URL for webhooks.
- An access token for the connected Instagram professional account with messaging permission.

## Local setup

```bash
cd backend
npm install
cp .env.example .env
```

Fill the server-side values in `.env`. Example product mapping:

```dotenv
AUTO_REPLY_ENABLED=true
META_GRAPH_API_BASE_URL=https://graph.instagram.com
META_GRAPH_API_VERSION=v27.0
INSTAGRAM_ACCOUNT_ID=YOUR_IG_PROFESSIONAL_ACCOUNT_ID
INSTAGRAM_ACCESS_TOKEN=YOUR_SERVER_SIDE_TOKEN
META_APP_SECRET=YOUR_META_APP_SECRET
META_WEBHOOK_VERIFY_TOKEN=generate-a-long-random-value
PRODUCT_LINKS_JSON=[{"title":"Blue Shirt","keywords":["blue shirt","shirt"],"url":"https://your-store.example/products/blue-shirt"}]
DATABASE_PATH=./data/androidinstadm.sqlite
MAX_MESSAGE_AGE_HOURS=24
```

Use `https://graph.instagram.com` for the Instagram Login API. Use `https://graph.facebook.com` only when your Meta app uses the Facebook Login / linked Page integration. The host, account ID, token type, and permission must all match the login product configured in Meta.

Run:

```bash
npm run build
npm test
npm run dev
```

Health check: `GET http://localhost:8080/health`

## Meta webhook configuration

- Callback URL: `https://YOUR_PUBLIC_HOST/webhooks/meta`
- Verify token: same value as `META_WEBHOOK_VERIFY_TOKEN`.
- App secret: `META_APP_SECRET`, server-side only.
- Subscribe to the Instagram messaging `messages` webhook field in the Meta App Dashboard and grant the required messaging permission for your selected login flow.

The GET endpoint verifies the webhook challenge. The POST endpoint validates `X-Hub-Signature-256` against the exact raw request body before processing events.

## Important operating constraints

- This automation responds only to an inbound user message. It never initiates a new conversation.
- Standard messaging replies are limited by Meta's messaging window. The default is 24 hours; do not increase it unless Meta explicitly permits the relevant conversation entry point and policy.
- Product matching is simple case-insensitive keyword substring matching. Avoid broad keywords such as `hi`, `yes`, or `ok` because they can cause incorrect product links.
- Product URLs must be HTTPS.
- If no product keyword matches, no message is sent.
- On a Send API error, the webhook returns HTTP 500 so Meta can retry. A SQLite event claim prevents simultaneous webhook retries from sending duplicate replies.
- SQLite must live on persistent storage in a production deployment. Do not deploy this file to an ephemeral filesystem or multiple backend replicas sharing no common database.
- Keep `META_APP_SECRET` and `INSTAGRAM_ACCESS_TOKEN` in the host's secret manager. Never put them in Android, source control, or `NEXT_PUBLIC_*` variables.
- This initial single-account setup is not yet a multi-tenant SaaS and does not include OAuth onboarding, token refresh, a managed queue, admin UI, or token encryption at rest.

## API and permission validation

Meta changes API versions and access requirements. Before enabling a real account, confirm the current account eligibility, API product, login flow, permission name, app review requirements, and webhook subscription settings in the Meta App Dashboard and official Instagram Messaging documentation.
