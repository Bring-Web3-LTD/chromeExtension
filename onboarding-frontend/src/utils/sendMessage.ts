// Posted to this window, not the parent: the kit's content script runs in every frame
// (all_frames), so it handles the message whether the page is a tab (/start) or an iframe (/embed).
export const sendMessage = (action: ACTIONS, payload: { url?: string } = {}) => {
    const searchParams = new URLSearchParams(window.location.search);
    const extensionId = searchParams.get('extensionId');
    window.postMessage({ from: 'bringweb3', action, extensionId, ...payload }, window.location.origin)
}

// "Go to Rewards". Where it leads comes from our backend as the `rewardsUrl` param on this page's
// URL (TODO#764), passed through as is: the kit checks it against its origin allowlist before
// opening anything. No param: no url, the kit opens the partner's cashbackPagePath.
export const openRewards = () => {
    const url = new URLSearchParams(window.location.search).get('rewardsUrl')
    sendMessage(ACTIONS.OPEN_CASHBACK_PAGE, url ? { url } : {})
}

export enum ACTIONS {
    OPEN_CASHBACK_PAGE = 'OPEN_CASHBACK_PAGE',
    OPEN_WALLET = 'OPEN_WALLET'
}
