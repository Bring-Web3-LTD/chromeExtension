
type SearchArrayResult =
    | { matched: false, match: undefined }
    | { matched: true, match: string }

type SearchRegexResult =
    | { matched: false, match: undefined }
    | { matched: true, match: string[] }

export const searchRegexArray = (regexArray: RegExp[], url: string): SearchRegexResult => {

    if (!url.includes('/')) {
        url += '/';
    }

    const slashIndex = url.indexOf('/');
    const host = url.substring(0, slashIndex);
    const path = url.substring(slashIndex);

    const unescapedPath = decodeURIComponent(path.replace(/\+/g, ' '));

    const revHost = host.split('').reverse().join('');

    const testStr = revHost + unescapedPath;


    for (const regex of regexArray) {
        const matchResult = regex.exec(testStr);
        if (matchResult && matchResult.index === 0 && matchResult[0]) {
            const rawGroups = [matchResult[0], ...Array.from(matchResult).slice(1)];
            const matchGroups = rawGroups.filter(g => g !== undefined) as string[];
            return {
                matched: true,
                match: matchGroups
            };
        }
    }
    return {
        matched: false,
        match: undefined
    };
}

export const searchArray = (entries: string[], query: string): SearchArrayResult => {
    const slashIndex = query.indexOf('/');
    const queryDomain = slashIndex === -1 ? query : query.substring(0, slashIndex);
    const queryPath = slashIndex === -1 ? '' : query.substring(slashIndex + 1);

    for (const entry of entries) {
        const entrySlashIndex = entry.indexOf('/');
        const entryDomain = entrySlashIndex === -1 ? entry : entry.substring(0, entrySlashIndex);
        const entryPath = entrySlashIndex === -1 ? '' : entry.substring(entrySlashIndex + 1);

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

        if (!domainMatches) continue;

        // Empty paths - match
        if (queryPath === '' && entryPath === '') {
            return { matched: true, match: entry };
        }

        const decodedQueryPath = decodeURIComponent(queryPath.replace(/\+/g, ' '));

        // Try exact match first
        if (decodedQueryPath.startsWith(entryPath)) {
            return { matched: true, match: entry };
        }

        // Try regex
        try {
            const regex = new RegExp(entryPath);
            if (regex.test(decodedQueryPath)) {
                return { matched: true, match: entry };
            }
        } catch (error) {
            // Not a valid regex pattern - continue
        }
    }

    return { matched: false, match: undefined };
}