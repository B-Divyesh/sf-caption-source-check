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

- Repair implementation commit: `bfe31deb83a1306f9cb165910de6fc18114ac3c5` (pushed to `origin/main`).
- Deployed with `/opt/fleet/lib/deploy-static.sh caption-source-check dist/site`. Azure Static Web Apps deployment `89ece65b-7f74-4422-ac20-d6aebdd9fb0b` succeeded and the custom domain was Ready.
- `https://caption-source-check.sociobot.in/` returned HTTPS 200. `/opt/fleet/lib/verify-url.sh` recorded a 1,183 ms network-idle load, no console/page errors, a title, `lang=en`, one `h1`, a `main` landmark, and no images without alt text.
- The live root sends the enforcing policy `default-src 'self' ... frame-ancestors 'none'`, plus `Referrer-Policy: strict-origin-when-cross-origin` and `X-Content-Type-Options: nosniff`. The live hashed JavaScript and self-hosted font send `Cache-Control: public, max-age=31536000, immutable`; the extension download sends the intended one-hour cache policy and `nosniff`.
- Live browser checks on desktop and 390×844 mobile covered `/`, `/privacy/`, and `/terms/`: zero serious/critical axe findings and zero console/page errors. On both form factors Tab focused the skip link and Enter moved focus to `main`; on mobile, Space opened the navigation menu.
- Live identity checks matched the deployed artifacts byte-for-byte: index `5d823b561a9492bbfcf151756b1eb612f48f6d790534c86ebe18d170a9fbbfa6`, privacy `aa00b23626f10c6318933e6e68c4bedcd6997d64ce2f2eb6c08f6ecf6c2a2d0d`, terms `f03ec262e9bfe5f99b40ba746fbed1127bf217925e37e20b797cdd655f921f39`, and extension ZIP `df7de85feb6f737a4b41e02100343ea3fe1ad2ad830074f9ca8150d8257b7b80`.

## Known gap

The brief's 50-permitted-public-stream / 95% benchmark is still unmeasured. It needs a maintained, permitted stream fixture matrix before store/release publication. Cross-origin iframes, closed shadow roots, and proprietary caption canvases remain intentional boundaries: this product does not bypass them.

---

## Independent verification 2 — FAIL (2026-08-28)

Candidate and deployed URL: `f3fe473b855c5c21e4f8139d2528c936463f7817` at <https://caption-source-check.sociobot.in>.

Fresh independent verification confirms the previous deployment-only repair is live: public HTML matches the candidate byte-for-byte; all 18 unpacked extension files match the live download; the live CSP includes `frame-ancestors 'none'`; and hashed assets receive one-year immutable caching. `npm ci`, 15/15 unit/document tests, strict type checking, clean production build, ZIP integrity, 10/10 local desktop/390px Playwright tests, live axe/console/network checks, and local mobile Lighthouse (100/100/100/100) passed. `npm audit --omit=dev` found zero production vulnerabilities.

Do **not** release this candidate as PASS. The unpacked reader has a P2 keyboard defect: activating “Skip to live captions” leaves focus on `BODY`, not the transcript, because `#transcript` is not focusable. The P1 acceptance criterion of 50 public streams with at least 95% availability/language correctness also remains unmeasured. See `.factory/verification-2.md` for exact commands, hashes, scope, and next steps.
