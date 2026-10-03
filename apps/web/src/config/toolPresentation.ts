import type { ToolIconId } from '@toolora/shared';
import {
  BinaryIcon,
  BracesIcon,
  CakeIcon,
  CalendarIcon,
  CalendarRangeIcon,
  ClockIcon,
  FileCodeIcon,
  GraduationCapIcon,
  KeyIcon,
  MapPinIcon,
  PercentIcon,
  PhoneIcon,
  RegexIcon,
  ScaleIcon,
  TableIcon,
  TextIcon,
  YenIcon,
} from '../components/ui/icons';

/**
 * Icon for each tool. Colour comes from the tool's category via `CATEGORY_PRESENTATION`, so a tool
 * card and its category card always match — this is icon choice only, keyed so a new `ToolIconId`
 * is a compile error here until it is drawn.
 */
export const TOOL_ICON: Record<ToolIconId, typeof YenIcon> = {
  yen: YenIcon,
  calendar: CalendarIcon,
  cake: CakeIcon,
  'graduation-cap': GraduationCapIcon,
  percent: PercentIcon,
  text: TextIcon,
  braces: BracesIcon,
  binary: BinaryIcon,
  key: KeyIcon,
  clock: ClockIcon,
  regex: RegexIcon,
  table: TableIcon,
  code: FileCodeIcon,
  scale: ScaleIcon,
  'calendar-range': CalendarRangeIcon,
  'map-pin': MapPinIcon,
  phone: PhoneIcon,
};
