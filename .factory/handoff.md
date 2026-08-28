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

---

## Repair 2 — release-blocking findings addressed (2026-08-28)

### What changed

- The large-text reader's live transcript is now programmatically focusable with `tabindex="-1"`. Keyboard activation of “Skip to live captions” therefore places focus on the transcript instead of leaving it on `BODY`.
- Added exact regression coverage in both document and real-browser suites. The Playwright test tabs to the reader's skip link, activates it with Enter, and asserts that `#transcript` owns focus on desktop and at 390 px. The document contract also asserts the link target and `tabindex` value.
- Added `tests/fixtures/permitted-public-stream-matrix.json`, a versioned 50-case acceptance matrix based on permissioned public W3C/MDN demonstration media, and `tests/public-stream-matrix.test.ts`. It covers captions, subtitles, no tracks, rejected chapters/descriptions/metadata, live and recorded state, BCP 47 language metadata, machine/human/unknown source metadata, and every supported rendered-caption surface. Every case asserts the monitor's availability, language, source type, and live result. The result is 50/50 correct (100%), above the brief's 95% acceptance threshold.

### Verification before deployment

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

- Clean install completed. The general dev dependency audit still reports 10 transitive development-tool advisories; `npm audit --omit=dev` reports 0 production vulnerabilities.
- `npm test`: 67/67 passed in 5 files, including all 50 matrix cases.
- Strict TypeScript check passed; there is no separate lint script in this repository.
- Production build passed and produced `dist/extension`, `dist/site`, and the extension ZIP. `unzip -t` passed.
- Playwright browser coverage passed 12/12 across desktop and 390×844 mobile, with axe serious/critical checks, console-error checks, responsive navigation, site skip-link keyboard behavior, and the new reader skip-link keyboard behavior.
- Privacy/offline/update review remains unchanged: no analytics, tracking, storage, host permission, third-party script/font, or service worker was added. The product remains an MV3 extension plus static site; browser extension updates are browser-managed, while the deployed static shell uses hashed immutable assets.

### Deployment and live verification

Pending this repair commit's static deployment. Record the deployment ID, live browser checks, response-policy checks, and identity hashes here after deployment.
