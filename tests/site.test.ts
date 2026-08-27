import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';

const pages = ['site/index.html', 'site/privacy/index.html', 'site/terms/index.html'];

describe('static pages', () => {
  for (const page of pages) {
    it(`${page} has the required document landmarks`, () => {
      const html = readFileSync(page, 'utf8');
      const document = new JSDOM(html).window.document;
      expect(document.documentElement.lang).toBe('en');
      expect(document.title.length).toBeGreaterThan(0);
      expect(document.querySelectorAll('h1')).toHaveLength(1);
      expect(document.querySelector('main')).not.toBeNull();
      for (const image of document.querySelectorAll('img')) expect(image.hasAttribute('alt')).toBe(true);
    });
  }

  it('does not load scripts or fonts from third-party origins', () => {
    const files = pages.map((page) => readFileSync(page, 'utf8')).join('\n');
    expect(files).not.toMatch(/<(script|link)[^>]+https?:\/\//i);
  });
});
