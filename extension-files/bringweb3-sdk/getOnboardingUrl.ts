import { logger } from "./utils/logger.js";
import type { OnboardingPage } from "./utils/background/onboarding.js";

/**
 * The welcome page URL for this platform, fetched from Bring by the background script (which
 * holds the API key), so it can be called from any part of the extension: a popup, an
 * extension page or a content script. Requires bringInitBackground with `onboarding: true`.
 *
 * @param page - 'start' for the welcome page to open in a tab, 'embed' for the block to embed in an iframe.
 * @returns A Promise resolving to the URL, or undefined when the platform has no welcome page.
 * @throws Will reject if the background script can't be reached or the request to Bring fails
 */
export const getOnboardingUrl = (page: OnboardingPage): Promise<string | undefined> => {
    return new Promise((resolve, reject) => {
        logger.info('[api] GET_ONBOARDING_URL event sent');
        chrome.runtime.sendMessage({
            from: 'bringweb3',
            action: 'GET_ONBOARDING_URL',
            page
        }, response => {
            if (chrome.runtime.lastError) {
                logger.error('failed to get the onboarding url', { error: chrome.runtime.lastError });
                reject(chrome.runtime.lastError);
                return;
            }
            if (response?.error) {
                reject(new Error(response.error));
                return;
            }
            logger.debug('[api] GET_ONBOARDING_URL response', { url: response?.url });
            resolve(response?.url);
        });
    });
}
