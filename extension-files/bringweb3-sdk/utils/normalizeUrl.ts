import { reverseStr } from "./reverseStr";

// Normalize a URL into a comparable match query. reverseHost/decodeTail default true, hostOnly false. Returns null if unparseable.
export const normalizeUrl = (
    url: string,
    options: { reverseHost?: boolean; decodeTail?: boolean; hostOnly?: boolean } = {}
): string | null => {
    const { reverseHost = true, decodeTail = true, hostOnly = false } = options;

    const parsedUrl = URL.parse(url) ?? URL.parse(`https://${url}`);

    if (!parsedUrl) return null; // Invalid URL

    const { host, pathname, search, hash } = parsedUrl;

    const strippedHost = host.replace(/^www\d*\./i, '');
    const normalizedHost = reverseHost ? reverseStr(strippedHost) : strippedHost;

    if (hostOnly) return normalizedHost;

    const tail = `${pathname}${search}${hash}`;
    const normalizedTail = decodeTail ? decodeURIComponent(tail.replace(/\+/g, ' ')) : tail;

    return `${normalizedHost}${normalizedTail}`;
}
