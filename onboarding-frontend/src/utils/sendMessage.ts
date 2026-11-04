// In a tab window.parent === window, so this covers both /start (tab) and /embed (iframe)
export const sendMessage = (action: ACTIONS) => {
    const searchParams = new URLSearchParams(window.location.search);
    const extensionId = searchParams.get('extensionId');
    window.parent.postMessage({ from: 'bringweb3', action, extensionId }, '*')
}

export enum ACTIONS {
    OPEN_CASHBACK_PAGE = 'OPEN_CASHBACK_PAGE',
    OPEN_WALLET = 'OPEN_WALLET'
}
