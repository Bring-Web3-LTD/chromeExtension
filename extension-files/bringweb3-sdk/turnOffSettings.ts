import { log } from "./utils/logger/logger.js";

interface TurnOff {
    isTurnedOff: boolean
}

/**
 * Retrieves the current "turn off" status, true means turned off and false is turned on
 * 
 * @returns A Promise resolving to the turn-off state
 * @throws Will reject if there's an error communicating with the background script
 */
export const getTurnOff = (): Promise<TurnOff> => {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
            from: 'bringweb3',
            action: 'GET_OPT_OUT'
        }, response => {
            if (chrome.runtime.lastError) {
                log.error('failed to get opt-out state', { error: chrome.runtime.lastError });
                reject(chrome.runtime.lastError);
                return;
            }
            resolve({ isTurnedOff: response.isOptedOut });
        });
    });
}

/**
 * Sets the opt-out status for the extension
 * 
 * @param state - Boolean indicating whether to turn off (true) or turn on (false)
 * @returns A Promise resolving to the new turn-off state
 * @throws Will reject if there's an error communicating with the background script
 */
export const setTurnOff = (state: boolean): Promise<TurnOff> => {
    return new Promise((resolve, reject) => {
        const time = state ? Number.MAX_SAFE_INTEGER : -1
        chrome.runtime.sendMessage({
            from: 'bringweb3',
            action: "OPT_OUT",
            time
        }, (response) => {
            if (chrome.runtime.lastError) {
                log.error('failed to set opt-out state', { error: chrome.runtime.lastError });
                reject(chrome.runtime.lastError);
                return;
            }

            if (response) {
                resolve({ isTurnedOff: response.isOptedOut });
            } else {
                reject('No response received');
            }
        });
    });
};