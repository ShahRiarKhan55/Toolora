/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** The site's real production origin (no trailing slash), or unset in development. See
   *  .env.example and docs/architecture.md, "SEO strategy". */
  readonly VITE_PUBLIC_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
