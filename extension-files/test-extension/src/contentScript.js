'use strict';
import { bringInitContentScript } from "@bringweb3/chrome-extension-kit";

const promptLogin = async () => {
    chrome.runtime.sendMessage({
        type: "SET_WALLET_ADDRESS",
        walletAddress: process.env.WALLET_ADDRESS || 'addr1qydfh2z0m4j2297rzwsu7dfu4ld3a6nhgytrn2wzxgvdlwd6y4l5psyq79gflnhwlttgw8gk7aj5j6lj95vg7my67vpsdcvu4l',
        from: 'demoExtension'
    });

    const walletUpdated = new CustomEvent('BRING:WALLET_UPDATED', { detail: {} });

    window.dispatchEvent(walletUpdated)
}

const getWalletAddress = async () => {
    const res = await chrome.runtime.sendMessage({ type: 'GET_WALLET_ADDRESS', from: 'demoExtension' });
    return res
}

bringInitContentScript({
    getWalletAddress,
    walletAddressListeners: ['BRING:WALLET_UPDATED'],
    promptLogin,
    theme: 'dark',
    text: 'lower',
    switchWallet: true,
    styleUrl: '',
});

window.addEventListener('message', async event => {
    if (!event?.data) return
    const { action, extensionId, from } = event.data
    if (from !== 'bringweb3:portal' || chrome.runtime.id !== extensionId) return;

    switch (action) {
        case 'CONNECT':
            event.source.postMessage({
                action: 'CONNECT_RESPONSE',
                walletAddress: await getWalletAddress(),
                from: 'demoExtension'
            }, '*')
            break;

        default:
            break;
    }
})