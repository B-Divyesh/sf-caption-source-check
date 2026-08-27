# Caption Source Check — visual thesis

## Direction: glacial minimal ceramics

Caption Source Check should feel like placing a small, calm listening object beside a noisy video player. The interface borrows from glazed porcelain, winter daylight, and the dark graphite marks used to label studio test pieces. Broad quiet fields make caption text the visual center; fine irregular contours and a single cobalt signal provide the product's identity without making accessibility feel clinical.

This is intentionally a single light treatment. The pale ceramic field is the product metaphor and is painted explicitly in every surface; the reader offers an additional high-contrast ink mode for low-light and visual-comfort needs.

## Palette

| Token | Value | Use |
| --- | --- | --- |
| Snowfield | `#F4F7F5` | page background |
| Porcelain | `#FFFDF8` | raised working surfaces |
| Ink | `#182321` | primary text |
| Slate | `#53635F` | secondary text |
| Hairline | `#CBD7D2` | dividers and control outlines |
| Cobalt | `#155EEF` | primary action and focus |
| Deep cobalt | `#0A3FA6` | action hover |
| Fjord | `#176B5B` | captions-found state |
| Ochre | `#8B5A00` | unavailable/uncertain state |
| Kiln red | `#A83D35` | error state |
| Night glaze | `#101816` | reader high-contrast background |

Ink on Snowfield and Slate on Snowfield exceed 4.5:1. State colors are always paired with an icon and plain-language label.

## Type

- Interface and captions: `Inter`, self-hosted variable WOFF2, with system fallbacks. Its open counters hold up at large caption sizes and small metadata sizes.
- Editorial display: `Newsreader`, self-hosted variable WOFF2, used only for the site headline and the quiet reader empty state. Its soft, carved terminals carry the ceramic metaphor without affecting utility text.
- Scale: 12 / 14 / 16 / 20 / 28 / 48 px. Body never falls below 16 px on the site; compact extension metadata is 14 px and remains supplementary.

## Spacing and shape

- 4 px base rhythm; primary gaps are 8, 12, 16, 24, 32, 48, and 72 px.
- Content measure is 68 characters. Extension controls remain at least 44 px tall.
- Surfaces use asymmetric ceramic radii (`18px 18px 22px 16px`) rather than a generic card grid. Thin inset highlights suggest glaze; hairlines are used only to separate distinct regions.
- The phone site drops nonessential metadata annotations and stacks the three-step explanation. The extension popup is purpose-built for a 360–400 px browser panel; the full reader expands caption measure, not chrome.

## Interaction grammar

- Cobalt marks the next action. Fjord, ochre, and kiln red report outcomes with a symbol plus words.
- Scanning is a short three-dot pulse contained inside the status mark. Results cross-fade and rise 6 px from the status origin over 180 ms.
- Track choice and text-size controls update the reader immediately. The live transcript follows the newest cue unless the user scrolls upward, where a “Jump to latest” control appears.
- `prefers-reduced-motion` removes translation and pulsing; state changes become an immediate opacity swap. Nothing loops after scanning finishes.

## Original asset plan and provenance

The landing hero uses one original still-life illustration: a translucent ceramic listening bowl holding layered caption ribbons, on a frost-white studio sweep. It explains the core idea—clean words lifted away from the player—without depicting unsupported transcription.

Prompt sheet: “Editorial product still life, glacial minimal ceramics. A hand-built ivory porcelain listening bowl with one thin cobalt glaze line; several small blank translucent frosted-glass ribbons rise gently from the bowl like caption lines; pale celadon shadows; cold northern window light; matte plaster studio sweep; subtle clay imperfections; quiet asymmetrical composition with generous negative space; medium-format product photography, 80mm lens, shallow but readable depth; palette of snow white, porcelain cream, graphite, celadon, one cobalt accent. No people, no screen, no video player, no letters, no text, no watermark, no logos, no brands, no gradients, no neon, no glossy CGI, no extra objects.”

- Generator: Azure OpenAI image generation via the Param Factory `factory-image` deployment.
- Generation date: 2026-08-27.
- License/provenance: original generated asset commissioned for this product; no third-party source image or copyrighted character.
- Source candidates and prompt sidecars live in `assets/src/`; optimized WebP/AVIF outputs live in `site/public/assets/`.

## Icon plan

Interface icons are small, hand-authored SVG strokes: caption brackets, a track ripple, a check, and an alert notch. They use `currentColor`, rounded line ends, and no external icon set.
