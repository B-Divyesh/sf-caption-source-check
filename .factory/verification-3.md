# Independent verification 3 — FAIL

Verified on 2026-08-28 against candidate commit `9c90cb01a8e59277cfffd108e4f6a24f945a0582` and <https://caption-source-check.sociobot.in>.

## Decision

**FAIL — do not release.** The brief's explicit 50-public-stream / 95% correctness acceptance criterion has not been measured. The repository's claimed 50/50 result is a synthetic jsdom matrix, not a test of 50 public streams.

## Release-blocking defect

### P1 — claimed 50-stream acceptance result is fabricated from synthetic inputs

The researched brief defines success as correct exposed-caption availability and language on a test set of 50 public streams at >=95%. The supplied matrix contains only three source URLs, and the test never requests or loads any of them. Instead it creates a `MatrixTrack` (`tests/public-stream-matrix.test.ts:18-24`), writes its expected language/kind/origin into the object (`:72-78`), and assigns it directly to a jsdom video's `textTracks` (`:78`). It also invents live status by assigning `duration` from the fixture (`:62-64`). The monitor is then asserted against those same synthetic values (`:81-89`). The listed sources are only three recorded W3C/MDN media files (`tests/fixtures/permitted-public-stream-matrix.json:5-8`), while the rows assert arbitrary languages, machine/human attribution, rendered-provider surfaces, and live states.

Result: `npm test`'s 50 matrix rows prove deterministic handling of mocked browser objects, but provide **zero observed public-stream cases** and cannot substantiate 50/50 or 100% real-world correctness. This is material because availability/language detection is the product's core job and the exact acceptance measure in the brief.

Required remediation: maintain at least 50 distinct, permissioned public stream/page fixtures with URLs, retrieval date, expected exposed state/language, and a browser-extension integration runner that loads each page without bypassing restrictions. Report observed numerator/denominator and retain failure cases. Do not label modelled cases as public-stream verification.

### P2 — no automated browser test exercises the installed extension's popup-to-reader workflow

`playwright.config.ts` starts only `npm run preview:site` and all checked-in Playwright cases target the static marketing site; the reader test injects stripped HTML rather than loading the MV3 extension. The built extension can be loaded unpacked and its manifest is valid, but the main user workflow has no repeatable installed-extension browser test. This gap allowed the invalid acceptance matrix to look like product-level coverage.

Required remediation: add a Chromium persistent-context test that loads `dist/extension`, invokes the action on a fixture page, verifies popup state, opens the reader, streams a cue, changes tracks, and covers unavailable/protected-page recovery.

## Checks that passed

### Clean build and repository gates

From a clean worktree at the candidate:

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

- `npm ci` completed. Its development dependency audit reports 10 transitive advisories; `npm audit --omit=dev` reports **0 production vulnerabilities**.
- `npm test`: **67/67** passed in five files. This includes the synthetic matrix described above, so it is not evidence for the P1 criterion.
- `npm run typecheck`: passed. No separate lint script exists in `package.json`.
- `npm run build`: passed and produced `dist/extension`, `dist/site`, and `dist/site/downloads/caption-source-check.zip`.
- The first Playwright attempt could not find a browser because this lockfile resolves Playwright 1.62.1 while the preinstalled browser was 1.58.2. After `npx playwright install chromium`, `npm run test:e2e` passed **12/12** (desktop and 390x844). This is an environment correction, not a product defect.
- `unzip -t` passed for the package. The manifest is MV3 with only `activeTab` and `scripting`; it declares no host permissions.

### Live deployment identity and response policy

The static HTML artifacts match the candidate byte-for-byte:

| Artifact | SHA-256 (local = live) |
| --- | --- |
| `/` | `5d823b561a9492bbfcf151756b1eb612f48f6d790534c86ebe18d170a9fbbfa6` |
| `/privacy/` | `aa00b23626f10c6318933e6e68c4bedcd6997d64ce2f2eb6c08f6ecf6c2a2d0d` |
| `/terms/` | `f03ec262e9bfe5f99b40ba746fbed1127bf217925e37e20b797cdd655f921f39` |

The local and live ZIP container SHA-256 values differ (`b6a4667e…` local, `cdf63157…` live), but unpacking and hashing every contained file found all **18 files byte-identical**. The difference is ZIP metadata, not a shipped-extension difference.

Live root, hashed JS, and ZIP responses returned HTTPS 200. They send `Content-Security-Policy` with `default-src 'self'` and `frame-ancestors 'none'`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, and HSTS. The hashed JS has `Cache-Control: public, max-age=31536000, immutable`; the ZIP has `public, max-age=3600`.

### Browser, accessibility, and responsive checks

Fresh Chromium checks at desktop 1440x1000 and mobile 390x844 covered `/`, `/privacy/`, and `/terms/`:

- Each response was 200 with `lang=en`, one `<h1>`, one `<main>`, a title, and no horizontal overflow.
- axe found **0 serious/critical** violations on every page at both sizes.
- No console errors or page errors occurred. Every browser request stayed on `https://caption-source-check.sociobot.in`; no third-party requests were observed.
- Keyboard: Tab focused the skip link and Enter focused `main` at both sizes. On 390px, Space opened the primary navigation.
- With reduced motion emulated, computed root scroll behavior was `auto` and a button transition duration was `1e-06s`.

The existing 12/12 local Playwright tests also passed after installing the matching browser. They cover the static pages, mobile menu, site skip link, and reader document skip-target contract; they do not cover an installed extension action (P2).

### Privacy and performance

- Static network observation found no third-party requests. Source review found no product `fetch`, XHR, WebSocket, beacon, cookies, local/session storage, IndexedDB, analytics, host permissions, or service worker. The scanner retains at most 150 cue rows in page memory (`src/scanner.ts:38-48`).
- The installed package's manifest contains only `activeTab` and `scripting`; no persistent host access is requested.
- Production static JS is 1,037 B and CSS is 9,329 B; self-hosted fonts total 106,340 B; the mobile hero WebP is 8,952 B. All are within the supplied budgets.
- Local mobile Lighthouse against the production build persisted a complete report: Performance **99**, Accessibility **100**, Best Practices **100**, SEO **100**; FCP 1.563 s, LCP 1.588 s, TBT 8.49 ms, CLS 0.00054, transfer 124,120 B. Lighthouse printed a post-audit target-crash during final screenshot capture, but wrote the report and its completed metrics.

## Scope note

This is a browser extension plus static site, not a PWA or backend. Service-worker offline/update checks and backend persistence/concurrency checks therefore do not apply. Extension updates are browser-managed. Product source was not modified during verification; only this report and the required handoff status are changed.
