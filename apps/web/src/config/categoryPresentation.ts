import type { CategoryId } from '@toolora/shared';
import {
  CodeIcon,
  GraduationCapIcon,
  SparklesIcon,
  SunIcon,
  YenIcon,
} from '../components/ui/icons';

interface CategoryPresentation {
  Icon: typeof SunIcon;
  /** Icon-tile colours; full class names so Tailwind can see them. */
  tile: string;
}

/** How each category looks. Keyed by CategoryId so adding a category is a compile error until styled. */
export const CATEGORY_PRESENTATION: Record<CategoryId, CategoryPresentation> = {
  japan: { Icon: SunIcon, tile: 'bg-accent-japan-soft text-accent-japan' },
  currency: { Icon: YenIcon, tile: 'bg-accent-currency-soft text-accent-currency' },
  student: { Icon: GraduationCapIcon, tile: 'bg-accent-student-soft text-accent-student' },
  developer: { Icon: CodeIcon, tile: 'bg-accent-developer-soft text-accent-developer' },
  ai: { Icon: SparklesIcon, tile: 'bg-accent-ai-soft text-accent-ai' },
};
