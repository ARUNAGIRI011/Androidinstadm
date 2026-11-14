# AndroidInstadm backend (initial scaffold)

Node.js 22+ / TypeScript / Express service.

## Local setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Health check: `GET http://localhost:8080/health`

## Meta webhook endpoint

- Callback URL: `https://YOUR_PUBLIC_HOST/webhooks/meta`
- Verify token: set the same random value in `META_WEBHOOK_VERIFY_TOKEN` and the Meta App Dashboard.
- App secret: set `META_APP_SECRET` on the server only.
- Subscribe to the relevant Instagram messaging webhook fields in the Meta App Dashboard after checking the current Meta product, account eligibility, and permission requirements.

The GET endpoint implements the webhook verification challenge. The POST endpoint validates `X-Hub-Signature-256` against the exact raw request body before parsing the event.

## Explicitly not implemented yet

- OAuth initiation/callback and authenticated tenant binding.
- Durable webhook event storage, idempotency, retry queue, and worker.
- Encrypted token storage and token refresh/revocation.
- Instagram Graph API message send/read calls.
- User authentication, tenant isolation, admin dashboard, AI/Nemotron, and billing.

The webhook currently acknowledges verified events but does not persist or process them. Do not connect a production Instagram account until durable storage, authentication, tenant routing, and message-policy checks are implemented and tested.

## Security

- Keep `META_APP_SECRET` and the verify token in the hosting provider's secret manager.
- Never place Meta secrets or access tokens in the Android app or a `NEXT_PUBLIC_*` variable.
- Expose the callback only over HTTPS.
- Do not log message bodies, access tokens, or other personal data.
- Use a stable persistent store and idempotency key before acknowledging production events.
