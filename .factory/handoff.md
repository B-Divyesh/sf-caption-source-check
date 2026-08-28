# Caption Source Check — repair handoff

Repair work order: `caption-source-check-repair-1`
Base / failed candidate: `130d63b604416af1ab11d54b965f2c7c7090473d` / `77f953e649d0e8227c636b6571aa83b2d25b12ad`

## What changed

- Native `TextTrack` discovery now accepts only the usable standard kinds: `captions` and `subtitles`. `chapters`, `descriptions`, and `metadata` no longer produce an available state, appear as a selectable track, activate cue listeners, or permit the reader. This fixes the verifier's P1 false positive while preserving caption/subtitle and visible-player-caption behavior.
- Added an Azure Static Web Apps deployment policy at `site/public/staticwebapp.config.json`. Vite copies it to the static deployment root as `dist/site/staticwebapp.config.json`; it supplies the enforcing CSP (including `frame-ancestors 'none'`), `nosniff`, referrer policy, and one-year immutable caching for fingerprinted `/assets/*`. `_headers` remains as a portable declaration, but Azure SWA uses the new platform-native configuration.
- Made each public-page `main` landmark programmatically focusable for the existing skip link. Browser coverage now verifies that keyboard activation moves focus to the main content and that the 390 px menu opens with Space.

## Regression coverage

- `tests/scanner.test.ts` has an individual false-positive case for each of `chapters`, `descriptions`, and `metadata`, plus a subtitle allow-list control. The test asserts unavailable/no tracks/no selected ID and confirms a rejected track stays disabled.
- `tests/site.test.ts` parses the Azure configuration and asserts the CSP, clickjacking policy, referrer and content-type protections, and immutable asset-cache policy.
- `tests/e2e/site.spec.ts` checks keyboard skip-link focus transfer and keyboard mobile-menu operation on both desktop and 390×844 mobile projects.

## Exact local verification

Ran from a clean dependency install on 2026-08-28:

```sh
npm ci
npm test
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
npm audit --omit=dev
unzip -t dist/site/downloads/caption-source-check.zip
```

Results:

- `npm test`: 15/15 passed in 3 files.
- `npm run typecheck`: passed. This repository has no separate lint script; strict TypeScript is the configured static-analysis gate.
- `npm run build`: passed from clean outputs. It produced `dist/extension`, `dist/site`, the packaged ZIP, and `dist/site/staticwebapp.config.json` byte-for-byte from the checked-in policy.
- `npm run test:e2e`: 10/10 passed. The desktop and 390×844 projects exercised `/`, `/privacy/`, and `/terms/` with axe (zero serious/critical findings), zero browser console errors, responsive download/navigation, skip-link keyboard focus, and mobile-menu keyboard operation.
- `npm audit --omit=dev`: 0 production vulnerabilities. `npm ci`'s general development-tree audit reports 10 advisory entries in transitive dev tooling; none are shipped to the extension or static site.
- Package consumer check: `unzip -t` passed for the ZIP. Its MV3 manifest contains only `activeTab` and `scripting`; it declares no host permissions. The production static payload is 1,037 B JavaScript and 9,329 B CSS; the extension ZIP is 67,551 B.
- Local mobile Lighthouse against the production static build: Performance 99, Accessibility 100, Best Practices 100, SEO 100; FCP 1.5 s, LCP 1.7 s, TBT 0 ms, CLS 0.002.
- Privacy/offline/update review: no analytics, third-party requests, storage, host permissions, or service worker were added. This is not a PWA, so it intentionally makes no unsupported offline claim; browser extension updates remain browser-managed and static assets are versioned/immutable at deployment.

## Deployment and live checks

The static deployment is performed with `/opt/fleet/lib/deploy-static.sh caption-source-check dist/site` after the repair commit is pushed. Record the resulting commit and live HTTPS/header verification here after deployment.

## Known gap

The brief's 50-permitted-public-stream / 95% benchmark is still unmeasured. It needs a maintained, permitted stream fixture matrix before store/release publication. Cross-origin iframes, closed shadow roots, and proprietary caption canvases remain intentional boundaries: this product does not bypass them.
