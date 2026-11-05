// Posted to this window, not the parent: the kit's content script runs in every frame
// (all_frames), so it handles the message whether the page is a tab (/start) or an iframe (/embed).
export const sendMessage = (action: ACTIONS) => {
    const searchParams = new URLSearchParams(window.location.search);
    const extensionId = searchParams.get('extensionId');
    window.postMessage({ from: 'bringweb3', action, extensionId }, window.location.origin)
}

export enum ACTIONS {
    OPEN_CASHBACK_PAGE = 'OPEN_CASHBACK_PAGE',
    OPEN_WALLET = 'OPEN_WALLET'
}
