interface Props {
    walletAddressUpdateCallback?: (callback: () => void) => void
    walletAddressListeners?: string[]
    getWalletAddress: () => Promise<WalletAddress>
    iframeEl: IFrame
}

interface UpdateAddressProps {
    getWalletAddress: () => Promise<WalletAddress>
    iframeEl: IFrame
}

const updateAddress = async ({ iframeEl, getWalletAddress }: UpdateAddressProps) => {
    if (!iframeEl) {
        iframeEl = document.querySelector(`#bringweb3-iframe-${chrome.runtime.id}`)
    }

    const address = await getWalletAddress()

    iframeEl?.contentWindow?.postMessage({ action: 'WALLET_ADDRESS_UPDATE', walletAddress: address }, '*')
    chrome.runtime.sendMessage({ action: 'WALLET_ADDRESS_UPDATE', from: 'bringweb3', walletAddress: address })
}

const startListenersForWalletAddress = ({ walletAddressListeners, walletAddressUpdateCallback, getWalletAddress, iframeEl }: Props) => {
    if (walletAddressUpdateCallback) {
        walletAddressUpdateCallback(() => updateAddress({ iframeEl, getWalletAddress }))
    } else if (walletAddressListeners) {
        // Listen for wallet address events
        for (let i = 0; i < walletAddressListeners.length; i++) {
            const eventName = walletAddressListeners[i]
            if (!eventName) continue
            window.addEventListener(eventName, async () => updateAddress({ iframeEl, getWalletAddress }));
        }
    }
}

export default startListenersForWalletAddress;