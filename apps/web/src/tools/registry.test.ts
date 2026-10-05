import { TOOL_VARIANTS, TOOLS } from '@toolora/shared';
import { describe, expect, it } from 'vitest';
import { TOOL_IMPLEMENTATIONS, TOOL_VARIANT_CONTENT } from './index';

// Enforces the registry ↔ implementation contract from CLAUDE.md: no metadata without a component,
// and no component without metadata.
describe('tool registry ↔ implementation parity', () => {
  it('has exactly one implementation per registered tool, and vice versa', () => {
    const registryIds = [...TOOLS.map((tool) => tool.id)].sort();
    const implementationIds = Object.keys(TOOL_IMPLEMENTATIONS).sort();
    expect(implementationIds).toEqual(registryIds);
  });

  it('gives every implementation a component and non-empty content', () => {
    for (const tool of TOOLS) {
      const implementation = TOOL_IMPLEMENTATIONS[tool.id];
      expect(implementation, tool.id).toBeDefined();
      expect(implementation!.Component).toBeDefined();
      expect(implementation!.content.howToUse).toBeTruthy();
      expect(implementation!.content.about).toBeTruthy();
      expect(implementation!.content.faq.length).toBeGreaterThan(0);
    }
  });

  it('has copy for exactly the registered variants, and each variant names a real implementation', () => {
    expect(Object.keys(TOOL_VARIANT_CONTENT).sort()).toEqual(
      TOOL_VARIANTS.map((v) => v.slug).sort(),
    );
    for (const variant of TOOL_VARIANTS) {
      expect(TOOL_IMPLEMENTATIONS[variant.toolId], variant.slug).toBeDefined();
      expect(TOOL_VARIANT_CONTENT[variant.slug]!.faq.length).toBeGreaterThan(0);
    }
  });
});
