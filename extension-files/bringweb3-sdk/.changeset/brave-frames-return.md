---
"@bringweb3/chrome-extension-kit": patch
---

Survive host-page React hydration recovery (GH#504): re-inject the popup when the host wipes it (bounded, stops after load), derive iframe-open state from the DOM, restore `flowId` on the activated popup, tolerate `document_start` stylesheet injection, and stop reporting `no_popup` when a popup is already open.
