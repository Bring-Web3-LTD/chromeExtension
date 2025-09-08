import storage from "../storage/storage"
import { searchCompressed } from "./domainsListCompression"
import { updateCache } from "./updateCache"

const urlRemoveOptions = ['www.', 'www1.', 'www2.']

const getRelevantDomain = async (url: string | undefined): Promise<{ matched: boolean, match: string }> => {
    const relevantDomains = await updateCache()
    const portalRelevantDomains = await storage.get('portalRelevantDomains')
    const falseResponse = { matched: false, match: '', phase: undefined }

    if (!url || !relevantDomains || !relevantDomains.length || !(relevantDomains instanceof Uint8Array)) return falseResponse

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

    const { hostname, pathname } = urlObj

    let query = hostname + pathname

    for (const urlRemoveOption of urlRemoveOptions) {
        query = query.replace(urlRemoveOption, '')
    }
    if (portalRelevantDomains) {
        const search = searchCompressed(portalRelevantDomains, query)
        if (search.matched) {
            await storage.remove('portalRelevantDomains')
            return search
        }
    }

    const { matched, match } = searchCompressed(relevantDomains, query)

    if (!matched) return falseResponse

    return {
        matched,
        match
    }
}

export default getRelevantDomain;