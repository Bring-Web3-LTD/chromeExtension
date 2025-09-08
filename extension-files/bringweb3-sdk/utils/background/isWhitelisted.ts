import { ApiEndpoint } from "../apiEndpoint";
import getDomain from "../getDomain";
import storage from "../storage/storage";
import { searchCompressed } from "./domainsListCompression";
import { updateCache } from "./updateCache";

const isWhitelisted = async (url: string): Promise<boolean> => {
    try {
        const whitelistEndpoint = ApiEndpoint.getInstance().getWhitelistEndpoint()

        if (!whitelistEndpoint) {
            return true; // No whitelist endpoint set
        }

        let whitelist = await storage.get('redirectsWhitelist');

        if (!(whitelist instanceof Uint8Array) || !whitelist?.length) {
            await updateCache()
            whitelist = await storage.get('redirectsWhitelist')
        }

        if (!whitelist?.length) return false

        const domain = getDomain(url)

        const { matched } = searchCompressed(whitelist, domain)

        return matched;

    } catch (error) {
        console.error("Invalid URL:", url);
        return false;
    }
}

export default isWhitelisted;