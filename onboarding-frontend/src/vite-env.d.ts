/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Bring API base for this build's environment, e.g. https://api.bringweb3.io/v1 */
  readonly VITE_API_ENDPOINT?: string
  /** x-api-key for the campaign resolve call (the EXTENSION-WELCOME key) */
  readonly VITE_API_KEY?: string
}
