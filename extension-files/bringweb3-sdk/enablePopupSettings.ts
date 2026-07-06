import { log } from "./utils/logger/logger.js";

interface PopupEnabled {
    isPopupEnabled: boolean
}

/**
 * Retrieves the current "turn off" status, true means turned off and false is turned on
 * 
 * @returns A Promise resolving to the turn-off state
 * @throws Will reject if there's an error communicating with the background script
 */
export const getPopupEnabled = (): Promise<PopupEnabled> => {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
            from: 'bringweb3',
            action: 'GET_POPUP_ENABLED'
        }, response => {
            if (chrome.runtime.lastError) {
                log.error('failed to get popup enabled state', { error: chrome.runtime.lastError });
                reject(chrome.runtime.lastError);
                return;
            }
            resolve(response);
        });
    });
}

/**
 * Sets if popup feature is enabled or disabled
 * 
 * @param state - Boolean indicating whether popup feature is enabled (true) or disabled (false)
 * @returns A Promise resolving to the new turn-off state
 * @throws Will reject if there's an error communicating with the background script
 */
export const setPopupEnabled = (state: boolean): Promise<PopupEnabled> => {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
            from: 'bringweb3',
            action: "SET_POPUP_ENABLED",
            isPopupEnabled: state,
        }, (response) => {
            if (chrome.runtime.lastError) {
                log.error('failed to set popup enabled state', { error: chrome.runtime.lastError });
                reject(chrome.runtime.lastError);
                return;
            }

            if (response) {
                resolve({ isPopupEnabled: response.isPopupEnabled });
            } else {
                reject('No response received');
            }
        });
    });
};

