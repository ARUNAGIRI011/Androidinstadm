# AndroidInstadm

Android-first Instagram messaging assistant with an Android control app and a secure cloud backend.

> **Integration boundary:** Instagram messaging must use Meta's official Instagram APIs, supported account types, permissions, webhooks, and review requirements. This project will not automate Instagram's private app UI, scrape accounts, collect passwords, or send unsolicited bulk messages.

## Planned capabilities

- Android app for connecting a supported Instagram professional account and managing automation.
- Backend webhook receiver for Meta messaging events.
- Human-approved automation rules and AI-assisted draft replies.
- Product/affiliate link responses for eligible user-initiated conversations.
- Campaign, conversation, and lead-management views.
- SaaS tenant isolation, usage limits, billing, and audit logs.

## Repository layout

- `android/` — native Android application (Kotlin, Jetpack Compose).
- `backend/` — planned API, webhook, worker, and persistence services.
- `docs/` — architecture, setup, security, and release notes.
- `.github/workflows/` — Android CI build.

## Current status

This is the initial project scaffold. The Android app is a UI shell; Meta OAuth, Graph API calls, webhook verification, backend persistence, AI integration, and billing are **not implemented yet**.

## Android build

Open `android/` in Android Studio, or install Gradle 8.13+ and build from the repository root with:

```bash
cd android
gradle assembleDebug
```

The GitHub Actions workflow builds the debug APK on pushes and pull requests. It does not publish a signed production APK.

## Configuration and secrets

Never commit Meta app secrets, access tokens, database credentials, signing keys, or AI provider keys. Store server-side secrets in the deployment platform's secret manager. Keep long-lived Meta tokens on the backend, not in the Android app.

## License

No license has been selected yet. Until a license file is added, normal copyright restrictions apply; do not assume this repository is open source or reusable under an open-source license.
