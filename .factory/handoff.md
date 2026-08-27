# Caption Source Check — build handoff

Build completed: 2026-08-27
Work order: `caption-source-check-build-1`

## What shipped

- A WXT + TypeScript Manifest V3 extension with a compact caption-availability popup.
- Explicit-use privacy model: only `activeTab` and `scripting` permissions, no broad host access, storage, analytics, network calls, or persistent content script.
- Detection of native page-exposed `TextTrack` caption/subtitle tracks, excluding tracks in an error state.
- Narrow fallback for explicit visible player caption UI (including YouTube-rendered caption segments) without reading hidden media URLs or private player state.
- Track label, language, caption/subtitle kind, live/recorded status, and machine/human source classification when the page metadata actually states it.
- A persistent large-text reader tab with timestamps, 22–56 px sizing, high-contrast mode, scroll-back, “Jump to latest,” temporary clear, and disconnect handling.
- First-class loading, no-video, no-track, restricted-page, waiting-for-cue, and source-disconnected states.
- Keyboard support throughout, visible focus styling, and `Ctrl+Shift+U` (`Control+Shift+U` on macOS) to invoke the browser action.
- A responsive static product site at `dist/site`, including privacy and terms pages and a linked extension zip at `dist/site/downloads/caption-source-check.zip`.
- Original generated ceramic hero artwork in responsive AVIF/WebP/JPEG formats; prompt, model, review, and provenance are recorded in `.factory/design.md` and `assets/src/`.
- Self-hosted Inter and Newsreader Latin variable fonts with SIL OFL attribution shipped in `THIRD_PARTY_NOTICES.txt`.

## Run and verify

```sh
npm install
npm test
npm run typecheck
npm run build
npm run test:e2e
```

Build outputs:

- `dist/extension/` — unpacked Chrome MV3 extension
- `dist/site/` — static deploy root (`index.html` is at the root)
- `dist/site/downloads/caption-source-check.zip` — packaged extension (67.5 KB in this build)

To smoke-test manually, load `dist/extension` via `chrome://extensions` → Developer mode → Load unpacked, open a page with an HTML video caption track, and invoke the toolbar action.

## Verification results

- `npm test`: 10/10 passed across caption metadata, cue normalization, native tracks, visible player-rendered captions, empty states, and site document contracts.
- `npm run typecheck`: passed with strict TypeScript.
- `npm run build`: passed from a clean output state; WXT extension 82.2 KB unpacked, 67.5 KB zipped.
- Playwright + axe at desktop and 390×844 mobile: 8/8 passed across `/`, `/privacy/`, and `/terms/`; zero serious/critical violations and zero console errors.
- Direct extension-page axe smoke test: popup and reader each had zero serious/critical violations and zero console errors.
- Mobile Lighthouse on the production build: Performance 99, Accessibility 100, Best Practices 100, SEO 100.
- Lighthouse field proxies: LCP 1.8 s, CLS 0.002, total blocking time 90 ms, speed index 2.6 s; total page transfer 121 KB.
- Budget details: site JS 1.04 KB, CSS 9.33 KB, fonts 106.34 KB total, largest hero derivative 25 KB; extension executable JS under 13 KB with one 48.26 KB font.
- `npm audit --omit=dev`: zero production vulnerabilities.
- Desktop and 390 px full-page screenshots were visually reviewed; layout, responsive stacking, typography, imagery, and content visibility passed.

## Privacy and policy notes

Caption cues are held only in the inspected page’s memory, capped at 150 lines, and disappear when that page closes or reloads. The reader DOM disappears when its tab closes. Nothing is persisted or transmitted. The extension never downloads media, reads hidden caption URLs, transcribes audio, or attempts to bypass DRM or host controls.

## Known gaps and next steps

- The brief’s 50-public-stream / 95% success benchmark was not run in this build environment. Before store publication, run a maintained browser fixture matrix against 50 permitted public streams and record platform/version results.
- Cross-origin iframe players, closed shadow roots, and proprietary caption canvases may not expose usable cues under `activeTab`; this is an intentional privacy and policy boundary, not something to bypass.
- Player DOM selectors can change. The native `TextTrack` path is stable; visible-player fallbacks should be regression-tested with every release.
- The zip is ready for the factory’s signing/store pipeline, but store review and signing are outside this repository.
