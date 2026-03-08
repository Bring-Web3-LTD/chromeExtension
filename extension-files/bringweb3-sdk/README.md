<a href="https://bring.network/"><img width="200px" src="https://media.bringweb3.io/logos/logo_darkbg_large.png"/></a><br>
<br><br>
<h1>@bringweb3/chrome-extension-kit</h1>
<br><br>

## Table of content
- [Table of content](#table-of-content)
- [Description](#description)
- [Prerequisites](#prerequisites)
- [Installing](#installing)
  - [Package](#package)
  - [Manifest](#manifest)
- [Importing](#importing)
  - [import](#import)
  - [require](#require)
- [Example](#example)
  - [background.js](#backgroundjs)
  - [contentScript.js](#contentscriptjs)
  - [Turnoff settings](#turnoff-settings)
- [Contact us](#contact-us)

## Description
The @bringweb3/chrome-extension-kit provides a robust, pre-configured framework for building browser extensions that bridge traditional web experiences with the crypto economy. From seamless wallet integration to automated cashback triggers, it handles the boilerplate so you can focus on the user experience.

### SDK
This integration kit is designed to enhance existing Chrome extensions by adding functionality that enables automatic crypto cashback on online purchases.

This kit consists of a set of JavaScript files that crypto outlets can integrate into their crypto wallet extensions. This integration facilitates a seamless addition of cashback features, leveraging cryptocurrency transactions in the context of online shopping.

When a user visits supported online retailer websites, the Crypto Cashback system determines eligibility for cashback offers based on the user's location and the website's relevance.

### Portal Integration

The full integration also includes a dedicated **Portal** where users can track offer details and reward statuses.
To integrate the Portal, please reach out to **[Bringweb3](https://bringweb3.io/#contact)**.

#### Portal Integration Requirements
For the Portal integration, you should provide your **SDK** for:
* **Wallet Connection:** Enabling users to connect their digital wallets.
* **Message Signing:** Required for specific solutions to verify user identity.

#### Implementation
Once integrated, **Bring** will provide a dedicated link to the Portal. You can surface this link within your app to give users **quick, seamless access** to their personalized rewards and status dashboard..

## Prerequisites

- Node.js >= 14
- Chrome extension manifest >= V2 with required permissions
- Obtain an identifier key from [Bringweb3](https://bringweb3.io/#contact)
- Provide a specific logo for the specific outlet

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

### import
```js
import { bringInitBackground } from '@bringweb3/chrome-extension-kit';
```
```js
import { bringInitContentScript } from '@bringweb3/chrome-extension-kit';
```
### require
```js
const { bringInitBackground } = require('@bringweb3/chrome-extension-kit');
```
```js
const { bringInitContentScript } = require('@bringweb3/chrome-extension-kit');
```

## Example

### background.js

```js

import { bringInitBackground } from '@bringweb3/chrome-extension-kit';

bringInitBackground({
    identifier: process.env.PLATFORM_IDENTIFIER, // The identifier key you obtained from Bringweb3
    apiEndpoint: 'sandbox', // 'sandbox' || 'prod'
    cashbackPagePath: '/wallet/cashback' // The relative path to your Cashback Dashboard if you have one inside your extension
})
```

### contentScript.js

```js 
import { bringInitContentScript } from "@bringweb3/chrome-extension-kit";

bringInitContentScript({
  // Async function that returns the current user's wallet address:
    getWalletAddress: async () => await new Promise(resolve => setTimeout(() => resolve('<USER_WALLET_ADDRESS>'), 200)),
    // Function that prompts a UI element asking the user to login:
    promptLogin: () => {...},

    // An optional list of custom events that dispatched when the user's wallet address had changed
    // Don't add it if you are using walletAddressUpdateCallback:
    walletAddressListeners: ["customEvent:addressChanged"],

    //an optional function that runs when the user's wallet address had changed and execute the callback,
    // Don't add it if you are using walletAddressUpdateCallback
    walletAddressUpdateCallback: (callback)=>{...},

    // Add switch wallet button, this requires also a UI for changing wallet address:
    switchWallet: true,
    themeMode: 'light', // 'light' | 'dark'
    styleUrl: 'https://<your-domain>'// optional, see examples
    text:'lower' // 'lower' | 'upper'

});
```
Note:
styleUrl is optional if you want to host the style file on your own servers.

styleUrl examples:
Single theme: https://media.bringweb3.io/examples/style/theme-single.json
Dark & light: https://media.bringweb3.io/examples/style/theme-dual.json

Alternatively, Bring can store the style for you. In that case, do not provide styleUrl.

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