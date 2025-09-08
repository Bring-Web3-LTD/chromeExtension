const MIN_DOMAIN_CHAR = '!'.charCodeAt(0)
const MAX_LCP = MIN_DOMAIN_CHAR - 1;

const reverseStr = (str: string): string => {
    return str.split('').reverse().join('');
}

export const compress = (domains: string[]): Uint8Array => {
    /**
      * Build front-compressed blob:
      *   - Reverse each domain, sort lexicographically
      *   - For each reversed domain:
      *       * compute LCP with previous
      *       * clamp to MAX_LCP, assert within [0..MAX_LCP]
      *       * emit 1-byte marker + remainder bytes
      */
    // Reverse only the part before the first "/", leave the rest intact
    const revs: string[] = [];
    for (const d of domains) {
        const slashIndex = d.indexOf('/');
        if (slashIndex === -1) {
            revs.push(reverseStr(d));
        } else {
            const domainPart = d.substring(0, slashIndex);
            const pathPart = d.substring(slashIndex);
            const revDomain = reverseStr(domainPart);
            revs.push(revDomain + pathPart);
        }
    }
    revs.sort();

    const out: number[] = [];
    let prev = '';

    for (const cur of revs) {
        // 1) raw LCP (must be **contiguous** from the start)
        const maxCmp = Math.min(prev.length, cur.length, MAX_LCP);
        let lcp = 0;
        while (lcp < maxCmp && prev[lcp] === cur[lcp]) {
            lcp++;
        }

        // 2) remainder bytes
        const rem = cur.substring(lcp);
        const remBytes = new TextEncoder().encode(rem);

        // ensure all rem-bytes are ≥ MIN_DOMAIN_CHAR
        if (remBytes.length > 0) {
            const bad = Math.min(...remBytes);
            if (bad < MIN_DOMAIN_CHAR) {
                throw new Error(`Invalid rem byte: ${bad}`);
            }
        }

        // 3) emit marker + remainder
        out.push(lcp);
        out.push(...remBytes);
        prev = cur;
    }

    return new Uint8Array(out);
}

export const decompress = (comp: Uint8Array): string[] => {
    /**
       * Decompress the front-compressed blob back to a list of domains.
       *
       * Returns a list of domain strings in their original (non-reversed) form.
       */
    const domains: string[] = [];
    let idx = 0;
    let prev = '';
    let n = 0;

    while (idx < comp.length) {
        const lcp = comp[idx];
        idx++;

        let j = idx;
        while (j < comp.length) {
            const byte = comp[j];
            if (byte === undefined || byte < MIN_DOMAIN_CHAR) {
                break;
            }
            j++;
        }

        const rem = new TextDecoder().decode(comp.slice(idx, j));
        const curRev = prev.substring(0, lcp) + rem;

        // reconstruct original domain (handle possible path part)
        const slashIndex = curRev.indexOf('/');
        let domain: string;
        if (slashIndex === -1) {
            domain = reverseStr(curRev);
        } else {
            const part = curRev.substring(0, slashIndex);
            const rest = curRev.substring(slashIndex);
            domain = reverseStr(part) + rest;
        }

        domains.push(domain);
        prev = curRev;
        idx = j;
    }

    return domains;
}

type SearchCompressedResult =
    | { matched: false, match: undefined }
    | { matched: true, match: string }

export const searchCompressed = (blob: Uint8Array, query: string, regex: boolean = false, fullMatch: boolean = false): SearchCompressedResult => {
    /**
      * Scan the compressed blob and return true if `query` matches:
      *   - exactly an entry, or
      *   - a wildcard entry ('*.base') matching 'foo.base' or 'base' itself.
      *
      * Because entries are sorted by reversed-domain, we can stop early:
      * Once we decode a record and it's lex-greater than target_rev, no
      * subsequent record can match.
      */
    const slashIndex = query.indexOf('/');
    const queryDomain = slashIndex === -1 ? query : query.substring(0, slashIndex);
    const queryPath = slashIndex === -1 ? '' : query.substring(slashIndex + 1);
    const queryDomainRev = reverseStr(queryDomain);

    let i = 0;
    let prev = '';

    while (i < blob.length) {
        // 1) read LCP marker
        const lcp = blob[i];
        if (lcp === undefined || lcp < 0 || lcp > MAX_LCP) {
            throw new Error(`Invalid LCP marker: ${lcp}`);
        }
        i++; // advance past the lcp marker

        // 2) Scan out the remainder bytes
        let j = i;
        while (j < blob.length) {
            const byte = blob[j];
            if (byte === undefined || byte < MIN_DOMAIN_CHAR) {
                break; // end of remainder bytes
            }
            j++;
        }
        const rem = new TextDecoder().decode(blob.slice(i, j)); // remainder of reversed-domain
        i = j; // move to next record

        // 3) Reconstruct full reversed-domain & normal domain
        const curRev = prev.substring(0, lcp) + rem;
        prev = curRev;

        // split entry and reconstruct domain and path
        const entrySlashIndex = curRev.indexOf('/');
        let entryDomain: string;
        let entryPath: string;
        if (entrySlashIndex === -1) {
            entryDomain = reverseStr(curRev);
            entryPath = '';
        } else {
            const part = curRev.substring(0, entrySlashIndex);
            entryDomain = reverseStr(part);
            entryPath = curRev.substring(entrySlashIndex + 1);
        }

        // 4) query check
        if ((entryDomain === queryDomain) ||           // exact match
            (entryDomain.startsWith('*.') && (        // wildcard match
                queryDomain.endsWith('.' + entryDomain.substring(2)) ||
                queryDomain === entryDomain.substring(2)))) {
            if (queryPath === '' && entryPath === '') {
                return {
                    matched: true,
                    match: `${entryDomain}${entrySlashIndex !== -1 ? `/${entryPath}` : ''}`
                }
            }
            if (!regex) {
                if ((fullMatch && queryPath === entryPath) || (!fullMatch && queryPath.startsWith(entryPath))) {
                    return {
                        matched: true,
                        match: `${entryDomain}${entrySlashIndex !== -1 ? `/${entryPath}` : ''}`
                    }
                }
            } else {
                const pattern = `^${entryPath}${fullMatch ? '$' : ''}`;
                if (new RegExp(pattern).test(queryPath)) {
                    return {
                        matched: true,
                        match: `${entryDomain}${entrySlashIndex !== -1 ? `/${entryPath}` : ''}`
                    }
                }
            }
        }

        // 5) Early-stop lexicographic check
        // If this reversed-domain > target_rev, all following will also be >
        if (reverseStr(entryDomain) > queryDomainRev) {
            return {
                matched: false,
                match: undefined
            }
        }
    }

    // no match found
    return {
        matched: false,
        match: undefined
    }
}