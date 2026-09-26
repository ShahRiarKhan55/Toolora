import { describe, expect, it } from 'vitest';
import { CATEGORIES, CATEGORY_IDS } from './categories';

describe('CATEGORIES', () => {
  it('lists every category id exactly once, in the declared order', () => {
    expect(CATEGORIES.map((category) => category.id)).toEqual([...CATEGORY_IDS]);
  });

  it('gives every category a non-empty name and description', () => {
    for (const category of CATEGORIES) {
      expect(category.name.trim()).not.toBe('');
      expect(category.description.trim()).not.toBe('');
    }
  });
});
