import { resolvePublicSiteOrigin } from '@toolora/shared';

/**
 * The configured production origin, or undefined in development / until a real one is set. Read once
 * at module load from Vite's client env — see .env.example and docs/architecture.md, "SEO strategy".
 */
export const PUBLIC_SITE_ORIGIN = resolvePublicSiteOrigin(import.meta.env.VITE_PUBLIC_SITE_URL);
