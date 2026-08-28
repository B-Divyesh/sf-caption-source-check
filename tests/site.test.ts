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

  it('ships Azure Static Web Apps response policy for the production deployment', () => {
    const config = JSON.parse(readFileSync('site/public/staticwebapp.config.json', 'utf8')) as {
      globalHeaders: Record<string, string>;
      routes: Array<{ route: string; headers: Record<string, string> }>;
    };
    const assets = config.routes.find((route) => route.route === '/assets/*');

    expect(config.globalHeaders['Content-Security-Policy']).toContain("frame-ancestors 'none'");
    expect(config.globalHeaders['Content-Security-Policy']).toContain("default-src 'self'");
    expect(config.globalHeaders['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(config.globalHeaders['X-Content-Type-Options']).toBe('nosniff');
    expect(assets?.headers['Cache-Control']).toBe('public, max-age=31536000, immutable');
  });
});
