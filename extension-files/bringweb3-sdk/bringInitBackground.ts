import { ApiEndpoint, EndpointName } from "./utils/apiEndpoint.js"
import storage from "./utils/storage/storage.js"
import { checkAndRunMigration } from './utils/background/dataMigration';
import handleContentMessages from './utils/background/handleContentMessages';
import handleUrlChange from './utils/background/handleUrlChange';
import { ENV_ENDPOINT } from "./utils/config.js";

interface Configuration {
    identifier: string
    apiEndpoint: string
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

const bringInitBackground = async ({ identifier, apiEndpoint, cashbackPagePath, whitelistEndpoint, isEnabledByDefault = true, showNotifications = true, notificationCallback }: Configuration) => {
    if (!identifier || !apiEndpoint) throw new Error('Missing configuration')
    if (ENDPOINT) console.log({ ENDPOINT });

    if (!['prod', 'sandbox'].includes(apiEndpoint)) throw new Error('unknown apiEndpoint')
    const apiEndpointInstance = ApiEndpoint.getInstance()
    apiEndpointInstance.setApiEndpoint(ENDPOINT || apiEndpoint as EndpointName)
    apiEndpointInstance.setWhitelistEndpoint(whitelistEndpoint || '')
    apiEndpointInstance.setApiKey(identifier)

    // Initialize debug cache after API endpoint is set
    storage.initializeDebugCache()

    const popupEnabled = await storage.get('popupEnabled')

    if (popupEnabled === undefined) {
        await storage.set('popupEnabled', isEnabledByDefault)
    }

    await checkAndRunMigration();

    handleContentMessages(cashbackPagePath, showNotifications)

    handleUrlChange(cashbackPagePath, showNotifications, notificationCallback)
}

export default bringInitBackground