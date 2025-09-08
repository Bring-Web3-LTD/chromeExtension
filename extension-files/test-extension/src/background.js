'use strict';
import { bringInitBackground } from '@bringweb3/chrome-extension-kit'

bringInitBackground({
    identifier: process.env.PLATFORM_IDENTIFIER,
    apiEndpoint: 'sandbox', // 'sandbox' || 'prod'
    whitelistEndpoint: 'https://media.bringweb3.io/tests/redirects.json',
    isEnabledByDefault: false,
    cashbackPagePath: '/main_window.html#/cashback',
    showNotifications: true,
    notificationCallback: () => { console.log('notificationCallback running from the extension') }
})

chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (message.from !== 'demoExtension') return;
    const { type } = message

    if (type === 'GET_WALLET_ADDRESS') {
        chrome.storage.local.get('walletAddress')
            .then(res => sendResponse(res.walletAddress))
        return true
    } else if (type === 'SET_WALLET_ADDRESS') {
        chrome.storage.local.set({ walletAddress: message.walletAddress })
            .then(() => sendResponse({ success: true }))
        return true
    }

    // if (message.action === "openWindow") {
    //     chrome.windows.create({
    //         url: "login.html",
    //         type: "popup",
    //         width: 800,
    //         height: 600
    //     });
    // }
});