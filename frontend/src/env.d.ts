/// <reference types="vite/client" />

// Augment Vite's existing ImportMetaEnv interface
declare interface ImportMetaEnv {
  // Add your VITE_ prefixed variables here.
  // Making them optional (?:) is safer as env vars might not always be defined.
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_KEY: string;
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_APP_VERSION: string;
  // Add any other VITE_ prefixed variables your client uses here

  // Optional: If you have many VITE_ variables and want a general fallback type.
  // Otherwise, it's better to explicitly type all VITE_ variables you use.
  // readonly [key: `VITE_${string}`]: any;
}

// This ensures ImportMeta is correctly typed with our augmented ImportMetaEnv.
// While often provided by `vite/client`, explicitly defining it can avoid
// TypeScript configuration nuances and ensures clarity.
interface ImportMeta {
  readonly env: ImportMetaEnv;
}