---
"@bringweb3/chrome-extension-kit": minor
---

Optional onboarding flow: `bringInitBackground({ onboarding: { on: true } })` opens Bring's welcome page on first install, `bringInitContentScript({ onboarding: { onWalletClick } })` captures the landing campaign the user came from and pairs it with the install, every request then carries `onboardingCampaignId`, and `getOnboardingUrl()` gives partners the welcome page URLs. `getUserId()` now shares one write between concurrent first calls.
