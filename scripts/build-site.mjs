import { cp, mkdir, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

execFileSync('node', ['scripts/generate-public-stream-fixtures.mjs'], { stdio: 'inherit' });

let files = [];
try {
  files = await readdir('.output');
} catch {
  execFileSync('npx', ['wxt', 'build'], { stdio: 'inherit' });
  execFileSync('npx', ['wxt', 'zip'], { stdio: 'inherit' });
  files = await readdir('.output');
}

let zip = files.find((name) => name.endsWith('.zip'));
if (!zip) {
  execFileSync('npx', ['wxt', 'zip'], { stdio: 'inherit' });
  zip = (await readdir('.output')).find((name) => name.endsWith('.zip'));
}
if (!zip) throw new Error('WXT did not produce an extension zip.');

execFileSync('npx', ['vite', 'build', '--config', 'site/vite.config.ts'], { stdio: 'inherit' });
await mkdir('dist/site/downloads', { recursive: true });
await cp(path.join('.output', zip), 'dist/site/downloads/caption-source-check.zip');
await cp('LICENSE', 'dist/site/LICENSE.txt');
await cp('public/THIRD_PARTY_NOTICES.txt', 'dist/site/THIRD_PARTY_NOTICES.txt');
await cp('.output/chrome-mv3', 'dist/extension', { recursive: true });
