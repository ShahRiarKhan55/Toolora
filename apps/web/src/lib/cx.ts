/** Joins class names, skipping falsy values. Small enough that a dependency (clsx) is not worth it. */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}
