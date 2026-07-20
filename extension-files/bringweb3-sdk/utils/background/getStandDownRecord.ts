import storage from "../storage/storage";
import parseUrl from "../parseUrl";

// Registrable-domain quiet record for a url, as '*.<registrable-domain>', using the
// server-sent TLD gate regex (relevantDomains type 'l'). Returns null when the TLD
// isn't one we serve retailers on — the caller then skips stand-down.
const getStandDownRecord = async (url: string): Promise<string | null> => {
    const regexes = await storage.get('relevantDomains');   // RegExp[] (compiled on get)
    const types = await storage.get('domainsTypes');        // string[], index-aligned
    if (!Array.isArray(regexes) || !Array.isArray(types)) return null;

    const tldRegex = regexes[types.indexOf('l')];           // forward/$-anchored, applied directly
    if (!tldRegex) return null;

    const match = tldRegex.exec(parseUrl(url));              // parseUrl strips protocol + www
    if (!match) return null;

    const tld = match[1];                                   // e.g. '.co.uk'
    const host = match[0];                                  // e.g. 'he.nordvpn.com'
    const parts = host.replace(tld, '').split('.');
    return `*.${parts[parts.length - 1]}${tld}`;
};

export default getStandDownRecord;
