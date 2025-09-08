import sendMessage from "./sendMessage";
import storage from "../storage/storage";

const getWalletAddress = async (tabId?: number): Promise<WalletAddress> => {
    let walletAddress: WalletAddress = await storage.get('walletAddress')

    try {
        if (!tabId) {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
            if (!tabs || !tabs[0] || !tabs[0].id) return walletAddress;
            tabId = tabs[0].id
        }

        const res = await sendMessage(tabId, { action: 'GET_WALLET_ADDRESS' });

        if (res?.walletAddress && walletAddress !== res?.walletAddress) {
            walletAddress = res?.walletAddress
            await storage.set('walletAddress', walletAddress as string)
        }
    } catch (error) {
        // console.log("Can't update wallet address");
    }

    return walletAddress
}

export default getWalletAddress;