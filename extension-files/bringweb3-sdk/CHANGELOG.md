# @bringweb3/chrome-extension-kit

## 1.4.3

### Patch Changes

- 916b73f: Improve popping speed
- cf971a2: Improve data expiration mechanism

## 1.4.2

### Patch Changes

- a628b15: Remove unnecessary calls to update domains list

## 1.4.1

### Patch Changes

- dbeea72: Prevent popup from popping after activation from Portal

## 1.4.0

### Minor Changes

- 9081329: add disable popup by default feature

## 1.3.11

### Patch Changes

- 8dd7229: Fix default quietDomain time

## 1.3.10

### Patch Changes

- 3ebc217: fix: queit domain time logics

## 1.3.9

### Patch Changes

- d94c938: fixed an issue with quiet domain expiration time
- 3deef5e: fix: quiet domain time logics
- 66a7a5f: fix: 'already activated' expiration time

## 1.3.8

### Patch Changes

- aa39263: add error report

## 1.3.7

### Patch Changes

- 70414cc: handle event with no data

## 1.3.6

### Patch Changes

- d2ec57b: fix missing popups

## 1.3.5

### Patch Changes

- 058809e: add timestamp to requests

## 1.3.4

### Patch Changes

- 7147361: add support for subdomains

## 1.3.3

### Patch Changes

- 6ac9ee2: fix whitelist check

## 1.3.2

### Patch Changes

- a151374: Fix no whitelist usecase

## 1.3.1

### Patch Changes

- 2b63c79: fix relevant domains list not updating

## 1.3.0

### Minor Changes

- b406236: Add option for whitelisted redirect urls

### Patch Changes

- ea6057f: fix notification link
- ed6dcce: Disable http caching for whitelist call

## 1.2.14

### Patch Changes

- 3775261: disable any popup when opted out, fix double sendResponse

## 1.2.13

### Patch Changes

- a1feeeb: id generation

## 1.2.12

### Patch Changes

- 4a10aeb: fix bug error on dev mode

## 1.2.11

### Patch Changes

- e76b67c: handle removing wallet address in case of undefined address

## 1.2.10

### Patch Changes

- 1ae4d4b: make api request interceptor

## 1.2.9

### Patch Changes

- 0f84d26: activate action uses domain instead of url

## 1.2.8

### Patch Changes

- 0fefbd5: quiet domains on close not saving

## 1.2.7

### Patch Changes

- a6b3d7d: Fix bug when navigating inside a website

## 1.2.6

### Patch Changes

- 67071be: Improve notification open page mechanism

## 1.2.5

### Patch Changes

- 1849a9b: Update README file

## 1.2.4

### Patch Changes

- 9d66cdc: Fix frequent updates for relevant domains

## 1.2.3

### Patch Changes

- aabb80e: update docs

## 1.2.2

### Patch Changes

- d5a3509: Fix listeners without sendResponse

## 1.2.1

### Patch Changes

- accb774: Save notification only if need to show it

## 1.2.0

### Minor Changes

- b12a7e5: Switch wallet feature

### Patch Changes

- b12a7e5: More consistent quiet domains after activations
- b12a7e5: Fix notification not showing problem

## 1.1.12

### Patch Changes

- 62d9402: fix getDomain function - won't remove www
- 9f2701c: Add userId

## 1.1.11

### Patch Changes

- 4138ff6: allow localhost for dev mode

## 1.1.10

### Patch Changes

- d418551: update bringInitContentScript interface

## 1.1.9

### Patch Changes

- 99de5c7: fix issue with process object is undefined

## 1.1.8

### Patch Changes

- d36d608: Add github repo

## 1.1.7

### Patch Changes

- a9c3010: fix bug with all_frames parameter and improve url extraction logic

## 1.1.6

### Patch Changes

- 6a226ff: add new option for updating the wallet address with walletAddressUpdateCallback
- 6365df0: update README

## 1.1.5

### Patch Changes

- c41a6b2: fix customEvent listener

## 1.1.4

### Patch Changes

- 3687ff7: fix return type of promptLogin to be void

## 1.1.3

### Patch Changes

- 5225ca7: Update README

## 1.1.2

### Patch Changes

- 621cd7a: Remove the need for iframeEndpoint

## 1.1.1

### Patch Changes

- 2029dac: update README according to last changes

## 1.1.0

### Minor Changes

- 1599073: Add dark theme option

### Patch Changes

- 1599073: tabs chrome API listeners, suport for manifest V2

## 1.0.12

### Patch Changes

- 5851f3b: Update address after login

## 1.0.11

### Patch Changes

- 2eb1803: Fix iframe id

## 1.0.10

### Patch Changes

- 924bba7: Set default alarm timing
- 006224d: Add compitabillity for storage API V2

## 1.0.9

### Patch Changes

- 2496cd3: Fix refetch on case someone clear the storage

## 1.0.8

### Patch Changes

- f529db6: Fix bug with storage naming

## 1.0.7

### Patch Changes

- 37fdf9c: Add prefix to all storage keys

## 1.0.6

### Patch Changes

- feec7cb: Handle unwanted messages from inside the extension

## 1.0.5

### Patch Changes

- e5daa89: Change endpoints and add some customTheme options

## 1.0.4

### Patch Changes

- 4ab2e4b: package.json update
- 4ab2e4b: Fix issue with popup after activation, add version to iframe

## 1.0.3

### Patch Changes

- 60cf2dc: Publish bug fixed

## 1.0.2

### Patch Changes

- 10a19e9: Remove testing flags

## 1.0.1

### Patch Changes

- 9cf057c: Update files on package.json

## 1.0.0

### Major Changes

- fb4c76e: Initial release of @bringweb3/chrome-extension-kit - Chrome Extension Kit from Bringweb3
