# Caption Source Check — independent verification

## Result: FAIL

Candidate: `77f953e649d0e8227c636b6571aa83b2d25b12ad` (`77f953e docs: finish accessible release and verification handoff`)

Verified on: 2026-08-27

Live URL: <https://caption-source-check.sociobot.in>

The static site and packaged extension contents are deployed, but this candidate does not meet the researched brief's core caption-availability contract and the live host does not enforce the supplied response-policy configuration. Do not promote it until the P1 is fixed and the deployed headers are verified.

## Blocking defects

| Severity | Finding | Evidence and user impact |
| --- | --- | --- |
| P1 / high | Non-caption `TextTrack`s are reported as captions. | `src/scanner.ts:74-78` appends every `video.textTracks` entry except an errored `<track>`; it does not allow-list `captions` or `subtitles`. `src/scanner.ts:161-170` then makes any such track set `available: true` and publishes its actual kind. A standard `<track kind="chapters">`, `descriptions`, or `metadata` track is therefore labelled in the popup as an "exposed caption track" and can open the reader, despite not being a usable official caption track. This is a false positive in the product's primary answer to the viewer/event-volunteer job-to-be-done. The unit suite covers captions, no-track, and rendered-caption cases, but no non-caption-kind boundary case. |
| P2 / medium | Production does not apply the checked-in CSP or cache policy. | `site/public/_headers:1-11` declares `Content-Security-Policy` with `frame-ancestors 'none'` and immutable one-year caching for `/assets/*`. Fresh `curl -I` responses from the live URL returned no `Content-Security-Policy` header and `cache-control: public, must-revalidate, max-age=30` for both `/assets/main-oMHAq7WB.js` and `/assets/inter-latin-wght-normal-Dx4kXJAl.woff2`. The missing CSP removes the candidate's intended XSS/clickjacking protection; short asset caching also misses the static-product caching requirement. |

## Candidate and deployment identity

- The checkout was clean and at the requested SHA before installation.
- Fresh `npm run build` produced `dist/extension`, `dist/site`, and the packaged ZIP successfully.
- Live `/`, `/privacy/`, and the live HTML asset references byte-match the fresh `dist/site` outputs (SHA-256 index: `5684aca8d1d610dd5db6361ea23b2d84cbe40ab3552fd86196d1a769ab3c898b`; privacy: `8c9ee272447adb1b499783be1b558f08eb584c065967e5d4e52b8030742afd14`).
- The raw ZIP container differs because it embeds build timestamps and order, but every unpacked file in the live download has the same SHA-256 as the fresh candidate package. Both packages contain the same 21 files and 82,186 uncompressed bytes. This confirms the live extension content matches the candidate.

## Quality-gate evidence

| Check | Result |
| --- | --- |
| `npm ci` | Passed. The general dev-tree audit reported 10 advisories; `npm audit --omit=dev` reported 0 production vulnerabilities. |
| `npm test` | Passed: 10/10 tests in 3 files. |
| `npm run typecheck` | Passed. |
| `npm run build` | Passed from a clean output state. WXT extension: 82.19 KB unpacked / 67.51 KB ZIP; static site JS: 1.04 KB, CSS: 9.33 KB, fonts: 106.34 KB. |
| `npm run test:e2e` | Passed: 8/8 Playwright checks across desktop and 390×844 mobile after installing Chromium revision 1234 required by the repository's Playwright 1.62 dependency. The initial attempt could not launch because that matching revision was not preinstalled. |
| Independent live browser check | Passed for `/`, `/privacy/`, and `/terms/` on desktop and 390×844: 0 axe serious/critical findings, 0 console errors, 0 page errors, one `<h1>`, `<main>`, `lang=en`, titles, image alt text, no horizontal overflow, and functional 390px menu. Keyboard Tab reached the skip link with a visible `rgb(21, 94, 239) solid 3px` outline. Reduced-motion context reduced control transition duration to `1e-06s`. |
| Extension-page error recovery | Passed. Freshly loaded unpacked MV3 popup and reader error states had 0 axe serious/critical findings, 0 console/page errors, and visible skip-link focus. Headless Chrome cannot grant the gesture-scoped `activeTab` permission to a manually opened extension page, so the normal toolbar-action path was assessed through the passing scanner tests and source/package inspection rather than misrepresenting a synthetic direct-page load as a user gesture. |
| Live privacy/network | Passed. Browser captures showed only same-origin document, script, stylesheet, image, font, and favicon requests; no analytics, CDN, or third-party request. Manifest contains only `activeTab` and `scripting`, with no host permissions. Repository/package scan found no storage API, fetch/XHR/WebSocket/beacon use, or persistent content script. |
| Lighthouse mobile run | The report completed and recorded Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.1 s, LCP 1.2 s, TBT 0 ms, CLS 0.001, and 120 KiB total transfer. The Lighthouse CLI exited non-zero afterward because the supplied Chromium target crashed during post-run full-page screenshot/BFCache collection; the emitted JSON contains the stated completed metrics. |

## Functional coverage

- Normal exposed native caption, language, machine-source metadata, live status, cleaned cue text, transcript timestamp, and the visible-player caption fallback: exercised by the passing scanner/unit cases.
- Boundary and recovery behavior: no-video/no-track, invalid reader source tab, restricted/internal-page popup error, 22–56 px reader sizing bounds, high-contrast control, and the 150-line transcript cap were inspected in the built candidate; no additional defect was found in those paths.
- The non-caption `TextTrack` boundary above is the decisive failure: the implementation does not distinguish a chapter/description/metadata track from a caption/subtitle track.

## Response headers and cache evidence

Live root, privacy, and download responses were HTTP 200 with HTTPS, HSTS, `Referrer-Policy: strict-origin-when-cross-origin`, and `X-Content-Type-Options: nosniff`. They lacked an enforcing CSP. All observed resources used `cache-control: public, must-revalidate, max-age=30`, including fingerprinted assets, rather than the checked-in immutable policy. No service worker is present or required for this browser extension/static site.

## Required next steps

1. Filter native tracks to the exposed usable-caption kinds (`captions` and `subtitles`), add regression tests for `chapters`, `descriptions`, and `metadata`, and re-run real toolbar-action tests against normal and false-positive fixtures.
2. Configure the deployment platform to honor the shipped `_headers` file (or its platform-equivalent), then verify an enforcing CSP with `frame-ancestors 'none'` and immutable caching for fingerprinted assets at the live URL.
3. Re-run the complete verification after both fixes. The brief's 50-permitted-public-stream / 95% benchmark remains unmeasured and must be recorded before release publication.
