---
"@bringweb3/chrome-extension-kit": patch
---

Remove the legacy 60-day cap on per-site opt-out duration so "forever" opt-outs persist. Expired quiet-domain records are now pruned only when adding records, never on read.
