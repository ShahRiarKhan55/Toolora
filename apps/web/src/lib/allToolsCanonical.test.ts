import { describe, expect, it } from 'vitest';
import { allToolsCanonicalPath } from './allToolsCanonical';

describe('allToolsCanonicalPath', () => {
  it('canonicalizes plain /tools (no params) to itself', () => {
    expect(allToolsCanonicalPath(null, '')).toBe('/tools');
  });

  it('canonicalizes a search query to /tools, not a separate page', () => {
    expect(allToolsCanonicalPath(null, 'json')).toBe('/tools');
  });

  it('canonicalizes an exact category filter to that category’s own page', () => {
    expect(allToolsCanonicalPath('developer', '')).toBe('/tools/developer');
  });

  it('canonicalizes a category filter combined with a search term to /tools, not the category page', () => {
    expect(allToolsCanonicalPath('developer', 'json')).toBe('/tools');
  });
});
