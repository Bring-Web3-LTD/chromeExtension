---
"@bringweb3/chrome-extension-kit": patch
---

Stop the notification request storm: WALLET_ADDRESS_UPDATE only triggers a notification check when the address actually changed, and an error response now backs off for an hour instead of retrying on every navigation
