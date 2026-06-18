import storage from "../storage/storage"
import { searchArray, searchRegexArray } from "./domainsListSearch"
import { updateCache } from "./updateCache"

const getRelevantDomain = async (url: string | undefined, searchType: string): Promise<{ matched: boolean, match: string | string[], type?: string }> => {
    const falseResponse = { matched: false, match: '', phase: undefined, type: undefined }
    const relevantDomains = await updateCache()
    const portalRelevantDomains = await storage.get('portalRelevantDomains')

    if (!url || !relevantDomains?.length) return falseResponse

    if (portalRelevantDomains) {
        const search = searchArray(portalRelevantDomains, url)
        if (search.matched) {
            await storage.remove('portalRelevantDomains')
            return search
        }
    }

    // Handle RegExp array from cache
    if (Array.isArray(relevantDomains)) {
        const result = await searchRegexArray(relevantDomains, url, searchType)

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