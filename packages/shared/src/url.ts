// Public-origin configuration and absolute-URL building (Phase 5). Toolora has no confirmed
// production domain yet (see CLAUDE.md), so the origin is always configuration, never a literal —
// callers pass in whatever `VITE_PUBLIC_SITE_URL` resolves to (or `undefined`), read by each app from
// its own env access (`import.meta.env` on the web, `process.env` on the server), since this
// framework-free package must not read either itself.

/** Strips trailing slashes so "https://example.com/" and "https://example.com" build the same URLs. */
function stripTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '');
}

/**
 * Resolves the configured public site origin from a raw env value. Returns `undefined` for an unset
 * or blank value, so callers can fall back to relative URLs — the normal case in local development,
 * where no production origin exists yet.
 */
export function resolvePublicSiteOrigin(rawValue: string | undefined): string | undefined {
  if (rawValue === undefined) return undefined;
  const trimmed = rawValue.trim();
  if (trimmed === '') return undefined;
  return stripTrailingSlashes(trimmed);
}

/**
 * Builds an absolute URL for `path` (e.g. "/tools/gpa-calculator") against `origin`. `path` is
 * normalized to start with exactly one leading slash, so the join never produces a double slash. When
 * `origin` is `undefined` (no configured production origin), returns `path` unchanged — a
 * same-origin-relative fallback that keeps local development working; callers that need a true
 * absolute URL (sitemap entries, JSON-LD) should treat an `undefined` origin as "not available yet"
 * instead.
 */
export function absoluteUrl(origin: string | undefined, path: string): string {
  const normalizedPath = `/${path.replace(/^\/+/, '')}`;
  return origin === undefined ? normalizedPath : `${origin}${normalizedPath}`;
}
