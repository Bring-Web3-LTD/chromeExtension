import storage from "./utils/storage/storage.js";
import { logger } from "./utils/logger.js";
import { DAY_MS } from "./utils/constants.js";

const ACTIONS = {
    OPEN_CASHBACK_PAGE: 'OPEN_CASHBACK_PAGE',
    OPEN_WALLET: 'OPEN_WALLET'
}

interface Configuration {
    onWalletClick: () => void
}

// Written by the welcome app's silent page (/go) when the user came from a campaign.
const ONBOARDING_KEY = 'bringOnboarding'
// The campaign attribution window; localStorage has no expiry of its own.
const MAX_AGE_MS = 183 * DAY_MS

// Hand the background the campaign and click the user came from, if the silent page left
// them here. Missing keys mean the user didn't come from a campaign: nothing to do.
// Only the welcome tab sees the record: the embed iframe is third-party on the partner's
// page, so its storage is partitioned.
const reportOnboardingClick = () => {
    // The welcome page was opened for one extension (its id is on the URL). Another kit
    // extension on the same origin must not claim the click as its own.
    if (new URLSearchParams(window.location.search).get('extensionId') !== chrome.runtime.id) return
    let record: any
    try {
        record = JSON.parse(localStorage.getItem(ONBOARDING_KEY) || 'null')
    } catch {
        return
    }
    if (!record?.campaignId || !record?.clickId) return
    if (typeof record.ts !== 'number' || Date.now() - record.ts > MAX_AGE_MS) {
        logger.debug(`[onboarding-msg] Stored campaign ignored - older than the attribution window`)
        return
    }
    logger.info(`[onboarding-msg] ONBOARDING_CAPTURE event sent`)
    chrome.runtime.sendMessage({ from: 'bringweb3', source: 'onboarding', action: 'ONBOARDING_CAPTURE', campaignId: record.campaignId, clickId: record.clickId })
        .catch(error => logger.warn(`[onboarding-msg] ONBOARDING_CAPTURE failed`, error))
}

/**
 * Initializes the onboarding content script: handles the buttons on the welcome page.
 * Opt-in - call it next to bringInitContentScript only if you use the onboarding flow.
 *
 * @param {Object} configuration - The configuration object.
 * @param {Function} configuration.onWalletClick - Called when the user clicks "KDA Wallet" on the welcome page.
 * @throws {Error} Throws an error if onWalletClick is missing.
 * @returns {Promise<void>}
 *
 * @example
 * bringInitOnboardingContentScript({
 *   onWalletClick: () => { ... }
 * });
 */
const bringInitOnboardingContentScript = async ({ onWalletClick }: Configuration) => {
    if (typeof onWalletClick !== 'function') throw new Error('Missing configuration')

    // Runs in every frame (all_frames is on), so a welcome page in an iframe is handled too.
    // Written by the background when it opens the welcome page. Unset means onboarding never ran.
    let origin: string | undefined
    try {
        origin = await storage.get('onboardingOrigin')
    } catch (error) {
        logger.warn(`[onboarding-msg] Failed to read the onboarding origin`, error)
        return
    }
    if (!origin || window.location.origin !== origin) return

    logger.debug(`[onboarding-msg] Welcome page detected - listening for messages`, { origin })

    reportOnboardingClick()

    window.addEventListener('message', (e) => {
        // event.origin and event.source are set by the browser; `from` and `extensionId` are not.
        if (e.source !== window || e.origin !== origin) return
        if (!e.data || e.data.from !== 'bringweb3') return

        const { action, extensionId } = e.data

        // Another extension with our kit may run on the same welcome page.
        if (extensionId !== chrome.runtime.id) {
            logger.debug(`[onboarding-msg] Ignored — event from another extension`, { action, extensionId })
            return
        }

        logger.info(`[onboarding-msg] ${action} event handled`)

        switch (action) {
            case ACTIONS.OPEN_CASHBACK_PAGE:
                // No url: the page never chooses where we navigate, the background opens cashbackPagePath.
                chrome.runtime.sendMessage({ action, from: "bringweb3", source: 'onboarding' })
                    .catch(error => logger.warn(`[onboarding-msg] ${action} failed`, error))
                break;
            case ACTIONS.OPEN_WALLET:
                onWalletClick()
                break;
            default:
                logger.warn(`[onboarding-msg] Unknown action: ${action}`);
                break;
        }
    })
}

export default bringInitOnboardingContentScript;
