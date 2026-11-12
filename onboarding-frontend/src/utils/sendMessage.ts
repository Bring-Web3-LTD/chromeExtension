// Posted to this window, not the parent: the kit's content script runs in every frame
// (all_frames), so it handles the message whether the page is a tab (/start) or an iframe (/embed).
export const sendMessage = (action: ACTIONS, payload: { url?: string } = {}) => {
    const searchParams = new URLSearchParams(window.location.search);
    const extensionId = searchParams.get('extensionId');
    window.postMessage({ from: 'bringweb3', action, extensionId, ...payload }, window.location.origin)
}

// Where "Go to Rewards" leads: the `rewardsUrl` param our backend put on this page's URL (TODO#764).
// The kit opens whatever it gets, so the check is here: only an https url is sent. Anything else,
// or no param, sends no url and the kit opens the partner's cashbackPagePath.
export const rewardsUrl = (): string | null => {
    const value = new URLSearchParams(window.location.search).get('rewardsUrl')
    if (!value) return null
    try {
        const url = new URL(value)
        return url.protocol === 'https:' ? url.toString() : null
    } catch {
        return null
    }
}

export const openRewards = () => {
    const url = rewardsUrl()
    sendMessage(ACTIONS.OPEN_CASHBACK_PAGE, url ? { url } : {})
}

export enum ACTIONS {
    OPEN_CASHBACK_PAGE = 'OPEN_CASHBACK_PAGE',
    OPEN_WALLET = 'OPEN_WALLET'
}
