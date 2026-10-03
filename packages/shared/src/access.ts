// Access levels, lowest first. A *declaration* of what a capability needs, never proof that someone
// has it: only the server decides who holds which level (see apps/server/src/access.ts and
// docs/architecture.md, "Accounts and entitlements"). Nothing is enforced for any current tool.
export const ACCESS_LEVELS = ['public', 'premium'] as const;

export type AccessLevel = (typeof ACCESS_LEVELS)[number];

/** A tool that does not declare `access` is public: usable by everyone, no account needed. */
export function requiredAccess(tool: { access?: AccessLevel }): AccessLevel {
  return tool.access ?? 'public';
}

/** True when `held` is at least `required` (levels are ordered, lowest first). */
export function meetsAccessLevel(held: AccessLevel, required: AccessLevel): boolean {
  return ACCESS_LEVELS.indexOf(held) >= ACCESS_LEVELS.indexOf(required);
}
