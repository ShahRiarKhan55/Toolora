import { describe, expect, it } from 'vitest';
import { buildToolStructuredData, buildWebSiteStructuredData } from './structuredData';
import { getToolBySlug } from './tools';

describe('buildWebSiteStructuredData', () => {
  it('returns undefined without a configured origin', () => {
    expect(buildWebSiteStructuredData(undefined)).toBeUndefined();
  });

  it('builds a valid WebSite entry with an absolute url', () => {
    const data = buildWebSiteStructuredData('https://toolora.example');
    expect(data).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Toolora',
      url: 'https://toolora.example/',
    });
  });

  it('never fabricates a rating, review or offer', () => {
    const data = buildWebSiteStructuredData('https://toolora.example')!;
    expect(data).not.toHaveProperty('aggregateRating');
    expect(data).not.toHaveProperty('review');
    expect(data).not.toHaveProperty('offers');
  });
});

describe('buildToolStructuredData', () => {
  const tool = getToolBySlug('gpa-calculator')!;

  it('returns undefined without a configured origin', () => {
    expect(buildToolStructuredData(undefined, tool)).toBeUndefined();
  });

  it('builds a WebApplication entry whose name/description/url match the tool itself', () => {
    const data = buildToolStructuredData('https://toolora.example', tool);
    expect(data).toEqual({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: tool.name,
      description: tool.seoDescription,
      url: `https://toolora.example/tools/${tool.slug}`,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any',
    });
  });

  it('never fabricates a rating, review or price', () => {
    const data = buildToolStructuredData('https://toolora.example', tool)!;
    expect(data).not.toHaveProperty('aggregateRating');
    expect(data).not.toHaveProperty('review');
    expect(data).not.toHaveProperty('offers');
  });
});
