// The legal links arrive as query params on startUrl (TODO#657), so anyone can craft a /start link
// with their own values. Only our own https origin is rendered, anything else drops the link.
export const legalUrl = (param: 'bringTou' | 'privacyPolicy') => {
    const value = new URLSearchParams(window.location.search).get(param)
    if (!value) return null
    try {
        const url = new URL(value)
        return url.origin === 'https://bring.network' ? url.toString() : null
    } catch {
        return null
    }
}
