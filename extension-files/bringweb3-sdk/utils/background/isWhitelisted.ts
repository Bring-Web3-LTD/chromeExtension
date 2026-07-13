import { ApiEndpoint } from "../apiEndpoint";
import getDomain from "../getDomain";
import storage from "../storage/storage";
import { searchArray } from "./domainsListSearch";
import { updateCache } from "./updateCache";
import { logger } from "../logger";

const isWhitelisted = async (url: string): Promise<boolean> => {
    try {
        const whitelistEndpoint = ApiEndpoint.getInstance().getWhitelistEndpoint()

        if (!whitelistEndpoint) {
            return true; // No whitelist endpoint set
        }

        let whitelist = await storage.get('redirectsWhitelist');

        if (!Array.isArray(whitelist) || !whitelist?.length) {
            await updateCache()
            whitelist = await storage.get('redirectsWhitelist')
        }

        if (!whitelist?.length) {
            logger.warn('[whitelist] Not whitelisted — whitelist is empty after cache refresh', { url })
            return false
        }

        const domain = getDomain(url)

        const { matched } = searchArray(whitelist, domain)

        if (!matched) logger.info('[whitelist] Not whitelisted — domain not in redirects whitelist', { url, domain })

        return matched;

    } catch (error) {
        logger.error('invalid URL', { url, error });
        return false;
    }
}

export default isWhitelisted;