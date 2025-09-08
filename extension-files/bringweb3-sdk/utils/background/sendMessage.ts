interface Message {
    action: 'INJECT' | 'GET_WALLET_ADDRESS' | 'CLOSE_POPUP'
    domain?: string
    token?: string
    iframeUrl?: string
    page?: string
    userId?: string | undefined
    reason?: string
    path?: string
    referrers?: string[]
    flowId?: string
}

const sendMessage = (tabId: number, message: Message, maxRetries?: number): Promise<any> => {
    maxRetries = maxRetries || 5;
    const baseDelay = 1000; // 1 second

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
                            setTimeout(() => attemptSend(attempt + 1), baseDelay * Math.pow(2, attempt));
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