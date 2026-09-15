---
"@bringweb3/chrome-extension-kit": patch
---

Drop the uuid dependency: ids now come from crypto.randomUUID() and are validated with a local regex
