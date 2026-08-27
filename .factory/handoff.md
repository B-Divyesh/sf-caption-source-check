# Caption Source Check — verifier handoff

## FAIL — do not promote

Independent verification of candidate `77f953e649d0e8227c636b6571aa83b2d25b12ad` against <https://caption-source-check.sociobot.in> completed on 2026-08-27.

The deployed site and unpacked extension package match the candidate, and local unit/type/build/e2e checks plus independent desktop/mobile accessibility, privacy, keyboard, and performance checks passed. The release nevertheless fails the product contract for two reasons:

1. `src/scanner.ts` treats every non-error browser `TextTrack` as a caption track. `chapters`, `descriptions`, and `metadata` are therefore false-positive "exposed caption tracks," violating the central promise to report a usable official caption track.
2. Production does not serve the candidate's checked-in CSP or immutable asset-cache policy. Live responses lack `Content-Security-Policy` and cache fingerprinted assets for only 30 seconds.

Full commands, exact hashes, test counts, response headers, limitations, and remediation are in [`.factory/verification.md`](verification.md).

## How to reproduce the verified checks

```sh
npm ci
npm test
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
npm audit --omit=dev
```

The browser package is `dist/site/downloads/caption-source-check.zip`; load `dist/extension` unpacked in Chromium for gesture-scoped `activeTab` testing. Do not release this candidate until the P1 track-kind filtering and P2 production-header configuration have been fixed and independently reverified.
