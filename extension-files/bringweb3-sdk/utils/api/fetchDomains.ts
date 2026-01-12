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


    return res
}

export default fetchDomains