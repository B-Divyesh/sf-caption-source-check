import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type PublicFixture = {
  id: string;
  path: string;
  kind: string;
  language: string;
  available: boolean;
  alternate?: { kind: string; language: string };
};

const matrix = JSON.parse(readFileSync('tests/fixtures/permitted-public-stream-matrix.json', 'utf8')) as {
  owner: string;
  purpose: string;
  retrievalMethod: string;
  fixtures: PublicFixture[];
};

describe('public-stream acceptance fixture registry', () => {
  it('maintains 50 distinct, first-party public stream pages with observed expectations', () => {
    expect(matrix.owner).toContain('Caption Source Check');
    expect(matrix.purpose).toMatch(/first-party browser fixture pages/i);
    expect(matrix.retrievalMethod).toMatch(/installed MV3 extension/i);
    expect(matrix.fixtures).toHaveLength(50);
    expect(new Set(matrix.fixtures.map((fixture) => fixture.id)).size).toBe(50);
    expect(new Set(matrix.fixtures.map((fixture) => fixture.path)).size).toBe(50);
    for (const fixture of matrix.fixtures) {
      expect(fixture.path).toMatch(/^[a-z0-9-]+$/);
      expect(typeof fixture.available).toBe('boolean');
      if (fixture.available) expect(fixture.language).not.toBe('');
    }
  });

  it('contains native caption/subtitle examples and explicit unavailable controls', () => {
    const kinds = new Set(matrix.fixtures.map((fixture) => fixture.kind));
    for (const kind of ['captions', 'subtitles', 'none', 'chapters', 'descriptions', 'metadata']) {
      expect(kinds.has(kind)).toBe(true);
    }
    expect(matrix.fixtures.filter((fixture) => fixture.available)).toHaveLength(45);
    expect(matrix.fixtures.filter((fixture) => !fixture.available)).toHaveLength(5);
    expect(matrix.fixtures.find((fixture) => fixture.alternate)).toMatchObject({
      kind: 'subtitles',
      language: 'en',
      alternate: { kind: 'subtitles', language: 'es' }
    });
  });
});
