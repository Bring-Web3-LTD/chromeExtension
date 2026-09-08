## iframe-frontend: GDPR

Everything under `iframe-frontend/` must comply with GDPR. Treat wallet addresses, user IDs, search queries, visited URLs/domains, IPs and any device fingerprint as personal data (pseudonymous identifiers count).

There is no consent flow and we do not want one. Compliance comes from only processing what is strictly necessary to deliver the cashback service, so nothing we build may need consent in the first place.

Rules when touching `iframe-frontend/`:
- No consent UI: never add a consent banner, cookie prompt or opt-in toggle. If a feature would require consent under GDPR/ePrivacy (non-essential cookies, profiling, marketing tracking), do not build it. Flag it and propose a version that does not need consent.
- Strictly necessary only: collect, send or store only the fields the feature needs to work. Adding a new personal-data field to analytics payloads or storage requires a stated purpose and why it is necessary for the service, in the PR description.
- First-party only: no new third-party trackers, pixels, fingerprinting libs or analytics SDKs. The existing `/analytics` endpoint is the only sink.
- Storage: `sessionStorage`/`localStorage`/cookies only for state the service needs to function (e.g. widget expand/collapse). Nothing for tracking, profiling or ads.
- Transparency: any flow that collects personal data links to the privacy policy / Terms of Use before the user submits.
- Retention: no personal data persisted client-side past the session; no expiry-less keys holding personal data.
- Rights: never cache personal data in a way that would survive an erasure request or block export/deletion.
- Transfers: no new endpoints outside `API_URL` without checking the data-transfer basis.
- Conflict: if a request conflicts with these rules, say so in one line and propose the compliant alternative instead of silently complying.

## UI: Accessibility

All UI in this repo (`iframe-frontend/`, the SDK-injected iframe/widget, any extension popup) must meet WCAG 2.2 AA. Accessibility is not a polish step; a UI change that is not accessible is not done.

Rules when touching UI:
- Semantics first: use native elements (`button`, `a`, `input`, `select`, `label`, headings, lists) before `div`/`span` with handlers. Only reach for `role`/`aria-*` when no native element fits, and then implement the full ARIA pattern (roles, states, keyboard).
- Keyboard: every action reachable and operable with keyboard alone (Tab/Shift+Tab, Enter/Space, arrows for groups, Escape to dismiss). Logical tab order; no keyboard traps.
- Visible focus: never `outline: none` without a `:focus-visible` replacement of equal or better visibility. Do not remove focus rings globally.
- Dialogs/widgets: expanded widgets, opt-out panels and modals use `role="dialog"` + `aria-modal` + `aria-labelledby`; move focus in on open, trap it while open, return it to the trigger on close; Escape closes.
- Names: every control has an accessible name (visible label, `aria-label`, or `alt`). Icon-only buttons need `aria-label`; decorative images use `alt=""`; iframes get a `title`.
- Colour/contrast: text 4.5:1, large text and UI parts 3:1. Never convey state (selected, error, active) by colour alone; add text, icon or `aria-*` state.
- Motion: wrap framer-motion and CSS animations with `prefers-reduced-motion` (`useReducedMotion` / media query). No flashing, no autoplaying motion that cannot be paused.
- Text and targets: no fixed heights that clip text at 200% zoom; do not set `font-size` in a way that blocks user resizing; interactive targets at least 24x24 CSS px.
- Status and errors: announce async results and errors with `aria-live` regions; tie input errors to the field with `aria-describedby` and `aria-invalid`. Loading spinners need an accessible label.
- Language: `lang` set on the document root; user-facing strings are real text, not images of text.
- Verify: before finishing UI work, do a keyboard-only pass and check for missing names, contrast and focus visibility (browser devtools accessibility panel or axe). Mention what was checked in the PR description.
- Conflict: if a request conflicts with these rules (e.g. "hide the focus ring", "make it colour-only"), say so in one line and propose the accessible alternative instead of silently complying.
