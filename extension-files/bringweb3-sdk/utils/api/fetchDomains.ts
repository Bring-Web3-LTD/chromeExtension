import { ApiEndpoint } from "../apiEndpoint"
import { strToUint8Array } from "../storage/helpers"
import apiRequest from "./apiRequest"

const fetchDomains = async (trigger?: string | null) => {
    const whitelistEndpoint = ApiEndpoint.getInstance().getWhitelistEndpoint()

    const request: Parameters<typeof apiRequest>[0] = {
        path: '/domains',
        method: 'GET',
    }

    request.params = {}

    if (whitelistEndpoint) {
        request.params.whitelist = encodeURIComponent(whitelistEndpoint)
    }

    if (trigger) request.params.trigger = trigger

    const res = await apiRequest(request)

    res.relevantDomains = strToUint8Array(res.relevantDomains)
    res.postPurchaseUrls = strToUint8Array(res.postPurchaseUrls)

    return res
}

export default fetchDomains