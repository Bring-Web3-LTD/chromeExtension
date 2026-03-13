import storage from "../storage/storage"
import { searchArray } from "./domainsListSearch"
import analytics from "../api/analytics"

const urlRemoveOptions = ['www.', 'www1.', 'www2.']
const falseResponse = { matched: false, match: '' }

const checkPostPurchasePage = async (url: string) => {

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

    let { hostname, pathname } = urlObj

    for (const urlRemoveOption of urlRemoveOptions) {
        hostname = hostname.replace(urlRemoveOption, '')
    }

    if (!pathname.endsWith('/')) pathname += '/'

    let query = hostname + pathname

    const postPurchaseUrls = await storage.get('postPurchaseUrls')

    if (!Array.isArray(postPurchaseUrls) || !postPurchaseUrls?.length) return falseResponse

    const { matched, match } = searchArray(postPurchaseUrls, query)

    if (!matched) {
        return falseResponse
    }

    await analytics({ type: 'thank_you_page', page: url, entry: match }).catch(() => { })

    return {
        matched,
        match,
    }
}

export default checkPostPurchasePage;