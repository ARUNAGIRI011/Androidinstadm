# Initial architecture

## Components

1. **Android client** — Kotlin + Jetpack Compose. Presents connection status, inbox overview, automation settings, and account controls. It must not store Meta client secrets or long-lived page/user tokens.
2. **Backend API** — planned service for authentication, tenant authorization, Meta OAuth callback, webhook verification, message processing, and dashboard APIs.
3. **Worker/queue** — planned asynchronous processing for webhook events, retries, rate limits, and outbound replies.
4. **Database** — planned tenant-scoped persistence for connected accounts, conversations, rules, audit events, and usage.
5. **AI provider** — optional server-side Nemotron integration. AI output should be validated and policy-checked before sending.
6. **Billing** — planned Razorpay subscription and webhook integration. Billing state must be verified server-side.

## Instagram integration constraints

- Use Meta's current official Instagram API for the supported account type and messaging use case.
- Confirm current app permissions, access level, account eligibility, review requirements, and messaging-window rules before implementation.
- Subscribe to and verify Meta webhooks on a public HTTPS backend.
- Only reply within Meta's permitted messaging context. Do not implement unsolicited bulk messaging, scraping, password collection, or private-API automation.
- Treat rate limits and API errors as normal operational conditions; use bounded retries and idempotency.

## Security requirements

- OAuth state must be random, single-use, and validated server-side.
- Encrypt tokens at rest and restrict access by tenant and connected account.
- Verify webhook signatures/tokens according to Meta's current documentation.
- Enforce tenant authorization on every backend query.
- Redact tokens and message content from logs where possible.
- Add audit events, retention controls, deletion flows, and rate limiting.

## Delivery sequence

1. Android shell and CI build.
2. Backend service, database schema, and tenant authentication.
3. Meta OAuth and webhook verification in a test app.
4. Conversation ingestion and compliant reply flow.
5. AI-assisted drafts with human approval and safety checks.
6. Usage metering, Razorpay billing, and SaaS admin.
7. Security review, Meta app review, staged rollout, and signed release.
