import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const source = 'tests/fixtures/permitted-public-stream-matrix.json';
const output = 'site/public/verification-fixtures';
const matrix = JSON.parse(await readFile(source, 'utf8'));

const escape = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const track = (kind, language, label) => kind === 'none'
  ? ''
  : `\n      <track kind="${escape(kind)}" srclang="${escape(language)}" label="${escape(label)}" src="/verification-fixtures/cues.vtt" default>`;

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await writeFile(path.join(output, 'cues.vtt'), 'WEBVTT\n\n00:00.000 --> 00:30.000\nOfficial fixture caption — Caption Source Check\n');
await writeFile(path.join(output, 'README.txt'), [
  'These pages are owned public verification fixtures for Caption Source Check.',
  'They are deliberately excluded from product navigation and sitemap discovery.',
  'Each page exposes a native HTML TextTrack so the installed extension can be tested without page-side mocks.'
].join('\n'));

for (const fixture of matrix.fixtures) {
  const title = `Caption Source Check verification fixture: ${fixture.id}`;
  const primary = track(fixture.kind, fixture.language, fixture.language || 'No caption track');
  const alternate = fixture.alternate
    ? track(fixture.alternate.kind, fixture.alternate.language, fixture.alternate.language)
    : '';
  const recovery = fixture.recovery
    ? `<button id="remove-track" type="button">Temporarily remove the caption track</button>\n    <script>document.querySelector('#remove-track').addEventListener('click', () => document.querySelector('track')?.remove());</script>`
    : '';
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">
    <title>${escape(title)}</title>
  </head>
  <body>
    <main>
      <h1>${escape(title)}</h1>
      <p>This first-party public test page exposes only the track documented in the repository fixture matrix.</p>
      <video aria-label="${escape(fixture.id)} verification stream" muted playsinline preload="metadata">${primary}${alternate}
      </video>
      ${recovery}
    </main>
  </body>
</html>`;
  await mkdir(path.join(output, fixture.path), { recursive: true });
  await writeFile(path.join(output, fixture.path, 'index.html'), html);
}
