import storage from "../storage/storage";
import { normalizeUrl } from "../normalizeUrl";

type SearchArrayResult =
    | { matched: false, match: undefined }
    | { matched: true, match: string }

type SearchRegexResult =
    | { matched: false, match: undefined, type: undefined }
    | { matched: true, match: string[], type: string }


export const searchRegexArray = async (regexArray: RegExp[], url: string, searchType?: string): Promise<SearchRegexResult> => {
    const noMatch: SearchRegexResult = { matched: false, match: undefined, type: undefined };

    const testStr = normalizeUrl(url);

    if (!testStr) return noMatch;

    const domainsTypes = await storage.get('domainsTypes');

    for (let i = 0; i < regexArray.length; i++) {
        const type = domainsTypes?.[i];

        if (searchType) {
            if (![...type].some(c => searchType.includes(c))) continue;
        }

        const regex = regexArray[i];
        if (!regex) continue;
        const matchResult = regex.exec(testStr);
        if (matchResult && matchResult.index === 0 && matchResult[0]) {
            const rawGroups = Array.from(matchResult);
            const matchGroups = rawGroups.filter(g => g !== undefined) as string[];
            return { matched: true, match: matchGroups, type };
        }
    }
    return noMatch;
}

export const searchSingle = (entry: string, query: string, regex?: boolean): boolean => {
    const slashIndex = query.indexOf('/');
    const queryDomain = slashIndex === -1 ? query : query.substring(0, slashIndex);
    const queryPath = slashIndex === -1 ? '' : query.substring(slashIndex + 1);

    const entrySlashIndex = entry.indexOf('/');
    const entryDomain = entrySlashIndex === -1 ? entry : entry.substring(0, entrySlashIndex);
    let entryPath = entrySlashIndex === -1 ? '' : entry.substring(entrySlashIndex + 1);

    // Domain matching (exact + wildcard)
    let domainMatches = false;
    if (entryDomain === queryDomain) {
        domainMatches = true;
    } else if (entryDomain.startsWith('*.')) {
        const base = entryDomain.substring(2);
        if (queryDomain.endsWith('.' + base) || queryDomain === base) {
            domainMatches = true;
        }
    }

    if (!domainMatches) return false;

    // Empty paths - match
    if (queryPath === '' && entryPath === '') {
        return true;
    }

    if (!regex) {
        if (queryPath.startsWith(entryPath)) {
            return true;
        }
    }

    else {
        // Try regex
        try {
            const regex = new RegExp(entryPath);
            if (regex.test(queryPath)) {
                return true;
            }
        } catch (error) {
            // Not a valid regex pattern - continue
        }
    }


    return false;
}

export const searchArray = (entries: string[] | { domain: string, regex: boolean }[], url: string): SearchArrayResult => {
    const query = normalizeUrl(url, { reverseHost: false });

    if (!query) return { matched: false, match: undefined };

    for (const entry of entries) {
        const domain = typeof entry === 'string' ? entry : entry.domain;
        const regex = typeof entry === 'string' ? false : entry.regex;

        if (searchSingle(domain, query, regex)) {
            return { matched: true, match: domain };
        }
    }
    return { matched: false, match: undefined };
}