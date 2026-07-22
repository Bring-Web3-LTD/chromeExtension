// Required manifest permissions. Missing any leaves the SDK unable to work
// (chrome.webNavigation / chrome.webRequest undefined, their listeners throw),
// so we fail fast at init with a clear message instead.
const REQUIRED_PERMISSIONS = ['storage', 'tabs', 'webNavigation', 'webRequest'];

// Host patterns granting access to every site of a scheme.
const ANY_HTTP = ['http://*/*', '*://*/*', '<all_urls>'];
const ANY_HTTPS = ['https://*/*', '*://*/*', '<all_urls>'];

// Throws if the extension's manifest is missing a permission the SDK requires.
export const validatePermissions = (): void => {
    if (typeof chrome === 'undefined' || typeof chrome.runtime?.getManifest !== 'function') {
        throw new Error('bringweb3-sdk: must run in a Chrome extension context');
    }

    const manifest = chrome.runtime.getManifest();
    const permissions = manifest.permissions ?? [];
    const hosts = (manifest as any).host_permissions ?? [];

    const missing = REQUIRED_PERMISSIONS.filter(p => !permissions.includes(p));
    if (!hosts.some((h: string) => ANY_HTTP.includes(h))) missing.push('host_permissions: http://*/*');
    if (!hosts.some((h: string) => ANY_HTTPS.includes(h))) missing.push('host_permissions: https://*/*');

    if (missing.length) {
        throw new Error(`bringweb3-sdk: manifest is missing required permissions: ${missing.join(', ')}`);
    }
};
