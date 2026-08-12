/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/** Id de build embebido por vite.config.ts (define) — ver useAppVersionCheck. */
declare const __APP_BUILD_ID__: string
