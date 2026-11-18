// Hosts /go may redirect to: the Chrome Web Store, on its current and its legacy domain.
// The store URL comes from Bring's API; anything else is a 404, so even a bad
// API answer can't bounce a visitor elsewhere.
export const REDIRECT_HOSTS = ['chromewebstore.google.com', 'chrome.google.com']

// localStorage key the silent page writes and the extension kit reads back after install.
export const ONBOARDING_KEY = 'bringOnboarding'

// Bring's API for this build's environment (set by scripts/build.sh), e.g.
// https://api.bringweb3.io/v1 on prod. /go/<campaignId> resolves the campaign there.
export const API_ENDPOINT = (import.meta.env.VITE_API_ENDPOINT ?? '').replace(/\/+$/, '')
export const API_KEY = import.meta.env.VITE_API_KEY ?? ''
