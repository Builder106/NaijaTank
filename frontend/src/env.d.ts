/// <reference types="vite/client" />

// Augment Vite's existing ImportMetaEnv interface
declare interface ImportMetaEnv {
  // Add your NG_APP_ prefixed variables here.
  // Making them optional (?:) is safer as env vars might not always be defined.
  readonly NODE_ENV?: string; // Included from the original Env interface provided by @ngx-env/builder
  readonly NG_APP_VERSION?: string;
  readonly NG_APP_GOOGLE_MAPS_API_KEY: string;
  readonly NG_APP_SUPABASE_URL: string;
  readonly NG_APP_SUPABASE_KEY: string;

  // If you expect other NG_APP_ prefixed variables that are not explicitly listed,
  // you can add a more general index signature for them:
  [key: `NG_APP_${string}`]: any;
}

// Note: We no longer declare "interface Env" or "interface ImportMeta { readonly env: Env; }"
// The augmentation of ImportMetaEnv above handles typing for import.meta.env.

// If you use the runtime option of @ngx-env/builder, _NGX_ENV_ is made available.
// It should contain the same environment variables.
declare const _NGX_ENV_: ImportMetaEnv;