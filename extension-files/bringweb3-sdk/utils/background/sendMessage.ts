interface Message {
    action: 'INJECT' | 'GET_WALLET_ADDRESS' | 'CLOSE_POPUP' | 'GET_PAGE_LINKS'
    domain?: string
    token?: string
    iframeUrl?: string
    page?: string
    userId?: string | undefined
    reason?: string
    path?: string
    referrers?: string[]
    flowId?: string
    placement?: PlacementConfig
}

const sendMessage = (tabId: number, message: Message, maxRetries?: number): Promise<any> => {
    maxRetries = maxRetries || 10;
    const baseDelay = 100; // 0.1 second
    const incrementalDelay = 20; // 0.02 seconds

    return new Promise((resolve, reject) => {
        const attemptSend = (attempt: number) => {
            // Check if tab exists using a more compatible method
            chrome.tabs.get(tabId, (tab) => {
                if (chrome.runtime.lastError) {
                    resolve(null);
                    return;
                }
                // Send message
                chrome.tabs.sendMessage(tabId, { ...message, from: 'bringweb3' }, (response) => {
                    if (chrome.runtime.lastError) {
                        if (attempt < maxRetries - 1) {
                            setTimeout(() => attemptSend(attempt + 1), baseDelay + incrementalDelay * attempt);
                        } else {
                            resolve(null);
                        }
                    } else {
                        resolve(response || null);
                    }
                });
            });
        };
        attemptSend(0);
    });
};

export default sendMessage;