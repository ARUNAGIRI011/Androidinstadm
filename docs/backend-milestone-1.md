# Backend milestone 1 — webhook foundation

## Delivered scaffold

- Node.js 22+ / TypeScript / Express service.
- Health endpoint.
- Meta webhook GET verification challenge.
- Raw-body HMAC SHA-256 signature validation for POST webhooks.
- Unit tests for signature validation.
- Backend CI workflow.

## Validation gates before production

1. Run GitHub Actions and fix any compile/test failures.
2. Deploy behind HTTPS and configure the Meta App Dashboard callback.
3. Validate webhook verification and signed event delivery using Meta's test tools.
4. Implement authenticated OAuth state, tenant binding, encrypted token persistence, event deduplication, and durable queue processing before accepting real account traffic.
5. Confirm exact current Meta API version, product mode, account eligibility, permissions, webhook fields, and messaging policy in Meta's official documentation and App Dashboard. These requirements can differ between Instagram API with Facebook Login and Instagram API with Instagram Login.
