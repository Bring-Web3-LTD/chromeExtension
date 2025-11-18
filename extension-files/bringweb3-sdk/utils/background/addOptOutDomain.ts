import storage from "../storage/storage"
import isRegexPattern from "./isRegexPattern"
import createSpecificQuietDomain from "./createSpecificQuietDomain"

const STORAGE_KEY = 'optOutDomains'

const addOptOutDomain = async (domain: string, time: number, url?: string) => {
    if (!domain) return

    let optOutDomains = await storage.get(STORAGE_KEY)

    if (typeof optOutDomains !== 'object' || optOutDomains === null) {
        optOutDomains = {}
    }

    const now = Date.now()
    const end = now + time

    // If URL is provided and domain contains regex, create a specific pattern
    let domainToStore = domain
    if (url && isRegexPattern(domain)) {
        domainToStore = createSpecificQuietDomain(url, domain)
    }

    optOutDomains[domainToStore] = [now, end]

    await storage.set(STORAGE_KEY, optOutDomains)
}

export default addOptOutDomain;