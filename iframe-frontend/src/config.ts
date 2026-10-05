// Dev-only override, same semantics as the SDK's `envName` (utils/apiEndpoint.ts): the value is
// the env path segment on api.bringweb3.io. Read once per iframe load, so removing the key and
// reloading restores the build-time URL. Anything that isn't a plain segment is ignored.
const readEnvName = (): string | null => {
    try {
        const envName = localStorage.getItem('envName')
        return envName && /^[A-Za-z0-9_-]{1,64}$/.test(envName) ? envName : null
    } catch {
        return null // storage blocked (e.g. third-party storage disabled)
    }
}

const ENV_NAME = readEnvName()

export const API_URL = ENV_NAME ? `https://api.bringweb3.io/${ENV_NAME}/v1/extension` : import.meta.env.VITE_API_URL
export const API_KEY = import.meta.env.VITE_API_KEY
export const ACTIVATE_QUIET_TIME = 2 * 60 * 60 * 1000
export const OB_ACTIVATE_QUIET_TIME = 0.5 * 60 * 60 * 1000  // 30 minutes for Offerbar
export const ENV = import.meta.env.VITE_ENV
export const BASE_PATH = import.meta.env.VITE_BASE_PATH || '/'
