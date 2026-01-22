import storage from "../storage/storage"
import { searchArray, searchRegexArray } from "./domainsListSearch"
import { updateCache } from "./updateCache"

const urlRemoveOptions = ['www.', 'www1.', 'www2.']

const getRelevantDomain = async (url: string | undefined, searchType: string): Promise<{ matched: boolean, match: string | string[], type?: string }> => {
    const relevantDomains = await updateCache()
    const portalRelevantDomains = await storage.get('portalRelevantDomains')
    const falseResponse = { matched: false, match: '', phase: undefined, type: undefined }

    if (!url || !relevantDomains || !relevantDomains.length) return falseResponse

    let urlObj = null

    try {
        urlObj = new URL(url)
    } catch (error) {
        try {
            urlObj = new URL(`https://${url}`)
        } catch (error) {
            return falseResponse
        }
    }

    let query = urlObj.toString();
    const protocolPrefix = `${urlObj.protocol}//`;
    if (query.startsWith(protocolPrefix)) {
        query = query.substring(protocolPrefix.length);
    }

    for (const urlRemoveOption of urlRemoveOptions) {
        query = query.replace(urlRemoveOption, '')
    }
    if (portalRelevantDomains) {
        const search = searchArray(portalRelevantDomains, query)
        if (search.matched) {
            await storage.remove('portalRelevantDomains')
            return search
        }
    }

    // Handle RegExp array from cache
    if (Array.isArray(relevantDomains)) {
        const result = await searchRegexArray(relevantDomains, query, searchType)

        if (!result.matched) return falseResponse

        return {
            matched: true,
            match: result.match,
            type: result.type
        }
    }
    return falseResponse
}

export default getRelevantDomain;