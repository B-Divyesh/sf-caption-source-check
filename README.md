# Caption Source Check

Caption Source Check is a free, local-first Chrome/Chromium extension for viewers and event volunteers who need a direct answer to one question: does this page expose a usable caption track?

When a standard browser `TextTrack` or supported visible player-caption surface is available, the extension reports its label, language, caption kind, live status, and whether metadata identifies it as machine- or human-created. A separate large-text reader follows active cues without the surrounding player interface.

Live site: <https://caption-source-check.sociobot.in>

## Product boundaries

Caption Source Check deliberately does not extract hidden tracks, download media, transcribe audio, bypass DRM, or defeat site restrictions. A platform-specific caption UI may offer captions without exposing them through the standard browser API; in that case the extension honestly reports that no exposed track was found.

The extension:

- uses `activeTab` permission only after the user opens it;
- has no broad host permission or persistent content script;
- makes no network requests;
- keeps at most 150 recent cue lines in page memory; and
- writes no captions, history, or settings to storage.

## Install the packaged extension

1. Download `caption-source-check.zip` from the site and extract it.
2. Open `chrome://extensions` in Chrome or a Chromium browser.
3. Enable **Developer mode**.
4. Choose **Load unpacked** and select the extracted folder.
5. Open a video page and choose Caption Source Check from the browser toolbar.

You can also use `Ctrl+Shift+U` (`Control+Shift+U` on macOS) to open the check with the keyboard.

The checked page must expose a standard HTML video caption/subtitle track. Browser-internal pages such as `chrome://` cannot be inspected.

## Develop

Requires Node.js 20 or later.

```sh
npm install
npm run dev          # WXT extension development mode
npm run dev:site     # landing site development server
```

Load `.output/chrome-mv3` as an unpacked extension while `npm run dev` is running.

## Test and build

```sh
npm test             # unit and document-contract tests
npm run typecheck    # strict TypeScript check
npm run build        # extension, zip, and static site
npm run test:e2e     # Playwright desktop/mobile + axe checks
```

`npm run build` produces:

- `dist/extension/` — unpacked MV3 extension;
- `dist/site/` — deployment root with `index.html`;
- `dist/site/downloads/caption-source-check.zip` — packaged extension.

`npm run build:site` also produces `dist/site`; if no packaged extension exists yet, it builds and zips one first.

## Architecture

- **WXT + TypeScript, Manifest V3** for the popup and large-text reader.
- **`chrome.scripting` + `activeTab`** for an explicit, temporary page bridge.
- **Standard `HTMLMediaElement.textTracks` / `TextTrack` APIs**, plus narrowly recognized visible player caption surfaces, for discovery and cue reading.
- **Vite + vanilla TypeScript** for the static landing, privacy, and terms pages.
- **Vitest + jsdom** for track parsing/state tests; **Playwright + axe-core** for browser checks.

The visual system and generated-image provenance are recorded in [`.factory/design.md`](.factory/design.md). Release verification and known gaps are in [`.factory/handoff.md`](.factory/handoff.md).

## Deployment

The factory deploys `dist/site` as a static site. No repository command changes DNS, billing, or hosting infrastructure.

## License

MIT — see [`LICENSE`](LICENSE).
