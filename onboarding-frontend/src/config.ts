// Hosts /go may redirect to: the Chrome Web Store, on its current and its legacy domain.
// Anything else is a 404, so a crafted /go link can't bounce a visitor elsewhere.
export const REDIRECT_HOSTS = ['chromewebstore.google.com', 'chrome.google.com']

// localStorage key the silent page writes and the extension kit reads back after install.
export const ONBOARDING_KEY = 'bringOnboarding'
