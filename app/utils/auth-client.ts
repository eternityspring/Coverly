import { createAuthClient } from 'better-auth/vue'

// Module init is too early for Nuxt's runtimeConfig, and Vite's import.meta.env only
// exposes VITE_* vars — not NUXT_PUBLIC_*. Auth calls only happen client-side, so use
// the current origin directly.
export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : '',
})
