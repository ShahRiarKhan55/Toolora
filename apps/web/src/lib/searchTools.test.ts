import { TOOLS } from '@toolora/shared';
import { describe, expect, it } from 'vitest';
import { searchTools } from './searchTools';

describe('searchTools', () => {
  it('returns every tool for an empty query', () => {
    expect(searchTools(TOOLS, '')).toHaveLength(TOOLS.length);
  });

  it('returns every tool for a whitespace-only query', () => {
    expect(searchTools(TOOLS, '   ')).toHaveLength(TOOLS.length);
  });

  it('matches by name, case-insensitively', () => {
    const results = searchTools(TOOLS, 'uuid');
    expect(results.map((t) => t.id)).toContain('uuid-generator');
  });

  it('matches by keyword', () => {
    const results = searchTools(TOOLS, 'epoch');
    expect(results.map((t) => t.id)).toContain('unix-timestamp-converter');
  });

  it('matches by category name', () => {
    const results = searchTools(TOOLS, 'japan');
    expect(results.length).toBeGreaterThanOrEqual(3);
    expect(results.every((t) => t.category === 'japan')).toBe(true);
  });

  it('matches by description text', () => {
    const results = searchTools(TOOLS, 'weighted gpa');
    expect(results.map((t) => t.id)).toContain('gpa-calculator');
  });

  it('returns an empty array when nothing matches', () => {
    expect(searchTools(TOOLS, 'nonexistent-tool-xyz')).toEqual([]);
  });

  it('does not mutate the input array', () => {
    const copy = [...TOOLS];
    searchTools(TOOLS, 'json');
    expect(TOOLS).toEqual(copy);
  });
});
