import { ApiEndpoint, EndpointName } from "./utils/apiEndpoint.js"
import storage from "./utils/storage/storage.js"
import { validatePermissions } from './utils/background/validatePermissions';
import { checkAndRunMigration } from './utils/background/dataMigration';
import handleContentMessages from './utils/background/handleContentMessages';
import handleTabEvents from './utils/background/handleTabEvents';
import { ENV_ENDPOINT } from "./utils/config.js";
import { updateCache } from "./utils/background/updateCache.js";
import { logger } from "./utils/logger.js";

interface Configuration {
    identifier: string
    apiEndpoint: string
    baseUrl?: string
    whitelistEndpoint?: string
    cashbackPagePath?: string
    isEnabledByDefault: boolean
    showNotifications?: boolean
    notificationCallback?: () => void
}
/**
 * Initializes the background script for the Bring extension.
 *
 * @async
 * @function bringInitBackground
 * @param {Object} configuration - The configuration object.
 * @param {string} configuration.identifier - The identifier for the extension.
 * @param {string} configuration.apiEndpoint - The API endpoint ('prod' or 'sandbox').
 * @param {string} [configuration.baseUrl] - Optional full API endpoint every request is sent to, e.g. 'https://api.partner.com/bring'. Bring's own host and paths are skipped entirely. Throws at init if it isn't a valid URL.
 * @param {string} configuration.whitelistEndpoint - Endpoint for whitelist of redirect urls.
 * @param {string} [configuration.cashbackPagePath] - Optional path to the cashback page.
 * @param {boolean} [configuration.isEnabledByDefault] - Determine if the user see the popup by default. defaults to true.
 * @param {boolean} [configuration.showNotifications] - Determine if the extension should show notifications about new rewards. defaults to true.
 * @throws {Error} Throws an error if identifier or apiEndpoint is missing, or if apiEndpoint is invalid.
 * @returns {Promise<void>}
 *
 * @description
 * This function sets up the background processes for the Bring extension. It initializes
 * the API endpoint, sets up listeners for alarms, runtime messages, and tab updates.
 * It handles various actions such as opting out, closing notifications, injecting content
 * based on URL changes, and managing quiet domains.
 *
 * The function performs the following tasks:
 * - Validates and sets the API endpoint
 * - Updates the cache
 * - Sets up listeners for alarms to update cache periodically
 * - Handles runtime messages for opting out and closing notifications
 * - Monitors tab updates to inject content or show notifications based on URL changes
 * - Validates domains and manages quiet domains
 *
 * @example
 * bringInitBackground({
 *   identifier: '<bring_identifier>',
 *   apiEndpoint: 'sandbox',
 *   whitelistEndpoint: 'https://example.com/whitelist.json',
 *   isEnabledByDefault: true,
 *   cashbackPagePath: '/cashback.html'
 * });
 */

const ENDPOINT = ENV_ENDPOINT as EndpointName

const bringInitBackground = async ({ identifier, apiEndpoint, baseUrl, cashbackPagePath, whitelistEndpoint, isEnabledByDefault = true, showNotifications = true, notificationCallback }: Configuration) => {
    if (!identifier || !apiEndpoint) throw new Error('Missing configuration')
    validatePermissions()
    if (ENDPOINT) logger.debug('endpoint configured', { ENDPOINT });

    if (!['prod', 'sandbox'].includes(apiEndpoint)) throw new Error('unknown apiEndpoint')
    const apiEndpointInstance = ApiEndpoint.getInstance()
    apiEndpointInstance.setApiEndpoint(ENDPOINT || apiEndpoint as EndpointName)
    apiEndpointInstance.setWhitelistEndpoint(whitelistEndpoint || '')
    apiEndpointInstance.setApiKey(identifier)
    // Throws on a malformed value, like the apiEndpoint check above.
    if (baseUrl) apiEndpointInstance.setBaseUrl(baseUrl)

    // Initialize debug cache after API endpoint is set
    storage.initializeDebugCache()

    // Dev environment segment. Later bringCache.set('envName', ...) calls sync the instance
    // through the storage helper; this read covers a restarted worker.
    apiEndpointInstance.setEnvName(await storage.get('envName') || '')

    let popupEnabled = await storage.get('popupEnabled')

    if (popupEnabled === undefined) {
        await storage.set('popupEnabled', isEnabledByDefault)
        popupEnabled = isEnabledByDefault
    }

    await checkAndRunMigration();

    handleContentMessages(cashbackPagePath, showNotifications)

    // A failed fetch must not take the navigation listeners below down with it: without them
    // the popup never runs again for this worker's lifetime. The cache retries on the next
    // navigation anyway.
    if (popupEnabled) await updateCache().catch(error => logger.error('initial cache update failed', { error }))

    handleTabEvents(cashbackPagePath, showNotifications, notificationCallback)
}

export default bringInitBackground