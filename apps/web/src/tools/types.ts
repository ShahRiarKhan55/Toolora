import type { ToolPreset } from '@toolora/shared';
import type { ComponentType, ReactNode } from 'react';
import type { FaqItem } from '../components/layout/ToolPageLayout';

/** A tool's explanatory copy, handed straight to `ToolPageLayout`. */
export interface ToolContent {
  howToUse: ReactNode;
  about: ReactNode;
  faq: readonly FaqItem[];
}

/** One entry in the tool implementation map: the lazy-loaded workspace plus its copy. */
export interface ToolImplementation {
  /** `preset` is only passed on a variant page (e.g. /tools/jpy-to-bdt); tools that have none ignore it. */
  Component: ComponentType<{ preset?: ToolPreset }>;
  content: ToolContent;
}
