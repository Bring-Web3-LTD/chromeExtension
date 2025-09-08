import analytics from "../api/analytics";
import getUserId from "./getUserId";
import getWalletAddress from "./getWalletAddress";
import sendMessage from "./sendMessage";

const closeAllPopups = async (domain: string, currentTabId: number, closer: string, iframePath?: `/${string}`) => {
    const tabs = await chrome.tabs.query({});

    // All the tab IDs except the current one
    const ids = tabs.map(tab => tab.id).filter(id => id && id !== currentTabId) as number[];

    const events: any[] = []

    const userId = await getUserId()
    const walletAddress = await getWalletAddress()
    // Send all messages in parallel
    const promises = ids.map(id =>
        sendMessage(id, {
            action: 'CLOSE_POPUP',
            reason: 'already_activated',
            path: iframePath || '/',
            domain,
        }, 2)
            .then(res => {
                if (res.status === 'success') {
                    events.push({ type: 'popup_auto_close', location: res.location, flowId: res.flowId, closer, domain, userId, walletAddress })
                }
            })
            .catch(() => { })
    );

    await Promise.all(promises);

    if (events.length) await analytics(events)
}

export default closeAllPopups;