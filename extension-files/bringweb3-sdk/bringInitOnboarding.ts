import { backgroundReady } from "./bringInitBackground.js"
import { openWelcomePage, retryPendingOnboarding } from "./utils/background/onboarding.js"
import { logger } from "./utils/logger.js"

/**
 * Opt-in onboarding for the background script: on first install, creates the userId, asks
 * Bring for the welcome page and opens it in a tab. The welcome page then hands the kit the
 * campaign the user came from. Call it right after bringInitBackground, at the top level of
 * the service worker - the install event is missed otherwise.
 *
 * @throws {Error} If bringInitBackground hasn't been called yet.
 *
 * @example
 * bringInitBackground({ ... });
 * bringInitOnboarding();
 */
const bringInitOnboarding = () => {
    const ready = backgroundReady()
    if (!ready) throw new Error('bringInitOnboarding must be called after bringInitBackground')

    // Registered synchronously: the install event fires once, as soon as the worker is up.
    // Updates, reloads and browser updates are not an install and open nothing.
    chrome.runtime.onInstalled.addListener(({ reason }) => {
        if (reason !== 'install') return
        logger.info(`[onboarding] First install`)
        ready.then(openWelcomePage)
            .catch(error => logger.error(`[onboarding] Failed to open the welcome page, will retry on the next start`, { error }))
    })

    // Requests wait for the environment and the migration; the listener above doesn't.
    ready.then(retryPendingOnboarding)
        .catch(error => logger.error(`[onboarding] Not started`, { error }))
}

export default bringInitOnboarding;
