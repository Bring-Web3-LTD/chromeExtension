import compareVersions from './compareVersions'

// SDKs below 1.8.0 wipe quiet-domain records whose range exceeds 60 days.
// For those, "forever" per-site opt-out is clamped to 60 days and tagged type 'a'
// so the backend can later migrate the records to truly forever.
const isLegacyCapSdk = (version: string) => compareVersions(version, '1.8.0') === -1

export default isLegacyCapSdk
