<a href="https://bring.network/"><img width="200px" src="https://media.bringweb3.io/logos/logo_doc.png"/></a>
<h1>@bringweb3/chrome-extension-kit</h1>

## Description
The @bringweb3/chrome-extension-kit provides a robust, pre-configured framework for adding crypto cashback functionality to Chrome extension wallets.
This SDK is designed for seamless integration and once added to the  wallet, it autonomously handles the full cycle of the crypto cashback from online purchases.

### SDK
This SDK consists of a set of JavaScript files that crypto wallets can integrate into their Chrome extension wallets.
This integration facilitates a seamless addition of cashback features, allowing wallet users to earn crypto cashback on everyday shopping online.
When a user visits supported online retailer websites, the Crypto Cashback system determines eligibility for cashback offers based on the user's location and the website's relevance. If it is a supported merchant/retailer, the user will be able to activate the offer and receive crypto cashback on their purchases.

### Cashback Section
The integration also includes a dedicated Cashback Section in the wallet that is built by the Bring team based on your SDK.
Please provide the SDK to enable users to connect their digital wallets to [Bring](https://bringweb3.io/#contact).
Once integrated, **Bring** will provide a dedicated link to the Cashback Section. You can surface this link within your app to give users quick, seamless access to their personalized rewards and status dashboard.

## Prerequisites
- Node.js >= 14
- Chrome extension manifest >= V2 with required permissions
- Obtain an identifier key from [Bring](https://bringweb3.io/#contact)
- Provide a specific logo for the your wallet

##  Installing
### Package
Using npm:
```bash
$ npm install @bringweb3/chrome-extension-kit
```

Using yarn:
```bash
$ yarn add @bringweb3/chrome-extension-kit
```

Using pnpm:
```bash
$ pnpm add @bringweb3/chrome-extension-kit
```

### Manifest
Include this configuration inside your `manifest.json` file:
```json
  "permissions": [
    "storage",
    "tabs"
  ],
  "content_scripts": [
    {
      "matches": [
        "<all_urls>"
      ],
      "js": [
        "contentScript.js" // The name of the file importing the bringContentScriptInit
      ]
    }
  ],
  "host_permissions": [
    "https://*.bringweb3.io/*"
  ]
```

## Importing
Once the package is installed, you can import the library using `import` or `require` approach:
```js
import { bringInitBackground } from '@bringweb3/chrome-extension-kit';
import { bringInitContentScript } from '@bringweb3/chrome-extension-kit';
```
```js
const { bringInitBackground } = require('@bringweb3/chrome-extension-kit');
const { bringInitContentScript } = require('@bringweb3/chrome-extension-kit');
```

## Example
### background.js
```js

import { bringInitBackground } from '@bringweb3/chrome-extension-kit';

bringInitBackground({
    // ── MANDATORY ────────────────────────
    // identifier key obtained from Bring
    identifier: process.env.PLATFORM_IDENTIFIER,
    apiEndpoint: 'sandbox', // 'sandbox' | 'prod'

    // ── OPTIONAL ─────────────────────────
    // relative path to your Cashback Dashboard inside the extension
    cashbackPagePath: '/wallet/cashback',
})
```

### contentScript.js
```js 
import { bringInitContentScript } from "@bringweb3/chrome-extension-kit";

bringInitContentScript({
    // ── MANDATORY ────────────────────────
    // Async function that returns the current user's wallet address
    getWalletAddress: async () => ...,
    // function that prompts the user to log in
    promptLogin: () => {...},

    // ── MANDATORY (pick one) ────────────
    // An optional list of custom events that dispatched when the user's wallet address had changed
    // Don't add it if you are using walletAddressUpdateCallback
    walletAddressListeners: ["customEvent:addressChanged"],
    // An optional function that runs when the user's wallet address had changed and execute the callback
    // Don't add it if you are using walletAddressListeners
    walletAddressUpdateCallback: (callback) => {...},

    // ── OPTIONAL ─────────────────────────
    // 'lower' | 'upper' (defaults to 'lower')
    text: 'lower',
    // 'light' | 'dark' (defaults to 'light')
    themeMode: 'light',
    // show a switch-wallet button (requires a wallet-change UI)
    switchWallet: true,
    /* needed if you want to host the style file on your own servers.
    styleUrl examples:
      - Single theme: https://media.bringweb3.io/examples/style/theme-single.json
      - Dark & light: https://media.bringweb3.io/examples/style/theme-dual.json
      If not provided (recommended), Bring will host the style. */
    styleUrl: 'https://<your-domain>',
});
```

### Turnoff settings 
```javascript
import { getTurnOff, setTurnOff } from "@bringweb3/chrome-extension-kit";

// Get state example
const current = await getTurnOff()
console.log(current) // true | false

// Set state example
const res = await setTurnOff(true)
console.log(res.isTurnedOff) // true
```

## Contact us
For more information: [contact us](https://bringweb3.io/#contact)