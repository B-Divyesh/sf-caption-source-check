# Caption Source Check — independent verification 2

## Result: FAIL

Candidate tested: `f3fe473b855c5c21e4f8139d2528c936463f7817` (`f3fe473 docs: record repair deployment verification`)

Verified on: 2026-08-28

Live URL: <https://caption-source-check.sociobot.in>

The repair is genuinely deployed: the usable-track allow-list and live response policy are present.  However, this candidate does not satisfy the acceptance contract because keyboard activation of the reader skip link fails to move focus to the live-caption region.  The researched brief's stated 50-public-stream / 95% correctness measure is also still not measured, so release correctness at the product's intended scale cannot be confirmed.

## Blocking findings

| Severity | Finding | Fresh evidence and user impact |
| --- | --- | --- |
| P2 / medium | The large-text reader's keyboard skip link does not move focus to the captions. | `entrypoints/reader/index.html` links “Skip to live captions” to `#transcript`, but that `<section>` has no `tabindex` and is not otherwise focusable. In a freshly built, unpacked MV3 extension in Chromium, Tab focused that link and Enter left `document.activeElement` as `BODY` (not `#transcript`). This is a concrete keyboard-only failure in the core reader: a user cannot use the skip link to place their reading cursor at live captions. The site skip link correctly focused `main`; this defect is specific to the reader. |
| P1 / high | The brief's public-stream accuracy success measure is unverified. | The acceptance measure is “on a test set of 50 public streams, it correctly reports exposed-caption availability and language at least 95% of the time.” No committed fixture matrix, stream results, or automated/live test covers that set. Local scanner tests cover seven synthetic cases and correctly cover caption, subtitle, no-track, rendered-caption, and chapters/descriptions/metadata rejection, but they cannot establish the required 50-stream/95% result. Do not claim release readiness or accuracy until a permitted, maintained matrix and result are recorded. |

## Candidate/deployment identity

- The workspace was clean at the requested SHA before `npm ci`; no product source was changed during verification.
- Fresh production build output HTML SHA-256 values exactly match the live pages: `/` `5d823b561a9492bbfcf151756b1eb612f48f6d790534c86ebe18d170a9fbbfa6`; `/privacy/` `aa00b23626f10c6318933e6e68c4bedcd6997d64ce2f2eb6c08f6ecf6c2a2d0d`; `/terms/` `f03ec262e9bfe5f99b40ba746fbed1127bf217925e37e20b797cdd655f921f39`.
- The live ZIP container SHA differs from a fresh build (`df7de85…` live versus `8b4669…` local), consistent with ZIP timestamp metadata. Both were unpacked and `diff -qr` found all 18 contained files byte-identical. The live download is 67,551 B.
- The live `/`, `/privacy/`, `/terms/`, and extension download each returned HTTPS 200.

## Quality-gate evidence

| Check | Result |
| --- | --- |
| Clean install | `npm ci` passed. Its full dev dependency audit reported 10 advisories (1 low, 2 moderate, 4 high, 3 critical); `npm audit --omit=dev` passed with **0 production vulnerabilities**. |
| Unit/integration tests | `npm test` passed: **15/15** tests in 3 files. The scanner suite includes the repaired `chapters`, `descriptions`, and `metadata` false-positive boundaries and a subtitle control. |
| Static analysis | `npm run typecheck` passed. There is no configured lint script in `package.json`. |
| Exact production build | `npm run build` passed from clean outputs and produced `dist/extension`, `dist/site`, and the packaged ZIP. `unzip -t dist/site/downloads/caption-source-check.zip` passed. |
| Repository browser suite | First `npm run test:e2e` could not launch because the lockfile-resolved Playwright 1.62 required Chromium revision 1234, which was not initially installed. After `npx playwright install chromium`, a fresh rerun passed **10/10** desktop and 390×844 mobile tests. |
| Independent live browser checks | Chromium checks on `/`, `/privacy/`, and `/terms/` at both desktop (1440×1000) and 390×844 found 0 axe serious/critical violations, 0 console/page errors, no third-party requests, one `h1`, one `main`, `lang=en`, titles, alt text, and no horizontal overflow. On both sizes, Tab showed a `rgb(21, 94, 239) solid 3px` skip-link focus ring and Enter focused `main`; at 390px, Space opened the navigation menu. |
| Reduced motion | In the live site `prefers-reduced-motion: reduce` changed root scroll behavior to `auto` and button transition duration to `1e-06s`. |
| Extension runtime/error recovery | Fresh unpacked MV3 pages in Chromium had 0 console/page errors and 0 axe serious/critical findings. The popup correctly gave the protected-page recovery message and disabled Reader; the invalid-reader-source recovery message rendered. Reader controls clamped captions to 22px and 56px and toggled `aria-pressed` high contrast. Directly opening the popup cannot exercise the normal toolbar `activeTab` grant, so no synthetic direct-page result was represented as a normal toolbar scan. |
| Mobile Lighthouse (fresh local production build) | Performance **100**, Accessibility **100**, Best Practices **100**, SEO **100**; FCP 1.5 s, LCP 1.5 s, TBT 0 ms, CLS 0.002, total transfer 121 KiB. |
| Size budget | Initial site JS is 1,037 B and CSS 9,329 B; self-hosted fonts total 106,340 B. These are under the 200 KB JS / 50 KB CSS / 120 KB font budgets. The mobile AVIF hero is 9,266 B. Extension unpacked output is 82,282 B; ZIP is 67,551 B. |

## Privacy, network, and response-policy evidence

- The MV3 manifest contains only `activeTab` and `scripting`; it has no host permissions. Package/source inspection found no fetch/XHR/WebSocket/beacon, storage API, persistent content script, analytics, or third-party script/font URL.
- Independent live browser request capture found only same-origin resources. No analytics/tracking request or third-party request was observed.
- Fresh live response headers enforce `Content-Security-Policy: default-src 'self'; …; frame-ancestors 'none'`, `Referrer-Policy: strict-origin-when-cross-origin`, and `X-Content-Type-Options: nosniff`; HTTPS HSTS is present. Hashed `/assets/main-oMHAq7WB.js` returned `Cache-Control: public, max-age=31536000, immutable`; the extension ZIP returned the intended one-hour cache policy. This resolves the prior deployment-only header/cache defect.
- This is an extension plus static site, not a PWA: no service worker/offline-update claim is made or required. It is neither a library nor a CLI, so package-consumer API/CLI testing does not apply.

## Functional coverage and limits

- Passing automated scanner cases exercise normal exposed captions (language, machine metadata, live status, cue cleaning and transcript), subtitle tracks, no video/no track, player-rendered visible captions, and invalid non-caption kinds.
- The static product's normal download flow, privacy/terms routes, desktop/mobile layout, responsive menu, keyboard menu operation, error paths, and reduced motion were exercised as above.
- Browser automation cannot faithfully turn a directly opened extension document into a gesture-scoped toolbar invocation; Chromium correctly protects `activeTab` in that situation. The packaged popup recovery path was tested, and the source/package plus scanner suite cover the injected monitor. This limitation does not excuse the unmeasured 50-stream criterion.

## Required next steps

1. Make `#transcript` programmatically focusable (for example, `tabindex="-1"`) and add a browser regression test asserting that Enter on the reader skip link focuses it. Re-run accessibility checks on the unpacked extension.
2. Establish a permitted, versioned 50-public-stream fixture matrix spanning native captions, subtitles, no track, live/recorded, language metadata, machine/human metadata when available, and supported rendered caption surfaces. Record availability/language outcomes and demonstrate at least 95% correctness.
3. Repeat this independent verification after both items. The deployed header/cache repair itself has passed fresh verification.
