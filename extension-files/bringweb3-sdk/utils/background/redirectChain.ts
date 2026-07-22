const chains = new Map<number, string[]>();

// webRequest is validated present at init (see validatePermissions).
export const registerRedirectChain = () => {
    // Append each 3xx redirect target.
    chrome.webRequest.onBeforeRedirect.addListener(
        (d) => {
            const chain = chains.get(d.tabId);
            if (chain) chain.push(d.redirectUrl);
            else chains.set(d.tabId, [d.url, d.redirectUrl]);
        },
        { urls: ['<all_urls>'], types: ['main_frame'] }
    );
};

export const getChain = (tabId: number): string[] => chains.get(tabId) || [];

export const clearChain = (tabId: number) => { chains.delete(tabId); };
