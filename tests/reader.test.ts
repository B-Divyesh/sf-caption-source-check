import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';

describe('large-text reader document', () => {
  it('makes the skip-link destination programmatically focusable', () => {
    const document = new JSDOM(readFileSync('entrypoints/reader/index.html', 'utf8')).window.document;
    const skipLink = document.querySelector<HTMLAnchorElement>('.skip-link');
    const transcript = document.querySelector<HTMLElement>('#transcript');

    expect(skipLink?.getAttribute('href')).toBe('#transcript');
    expect(transcript?.getAttribute('tabindex')).toBe('-1');
  });
});
