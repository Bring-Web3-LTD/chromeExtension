// ecko-topOB-coloring AB test: colour-only variants for the framed offer bar (top OB).
// Each variant overrides the framed surface's --tb-* CSS custom properties
// (see pages/Framed/styles.module.css). variantA / control / absent = no change.
// Applied from rootLoader after loadTheme so it lands before first paint.
const NAVY = '#1A1E3E'

const VARIANT_VARS: Record<string, Record<string, string>> = {
    // Magenta → blue-purple vertical gradient bar; text/button unchanged.
    variantB: {
        '--tb-bg': 'linear-gradient(180deg, #9B26A1 0%, #43488D 100%)',
    },
    // Yellow → pink gradient bar with dark text and a dark activate button.
    variantC: {
        '--tb-bg': 'linear-gradient(180deg, #FFD300 0%, #FF00B8 142.25%)',
        '--tb-platform-name-fc': NAVY,
        '--tb-retailer-name-fc': NAVY,
        '--tb-plus-fc': NAVY,
        '--tb-offer-text-f-c': NAVY,
        '--tb-offer-text-highlight-f-c': NAVY,
        '--tb-opt-out-btn-f-c': NAVY,
        '--tb-activate-btn-bg': NAVY,
        '--tb-activate-btn-f-c': '#FFFFFF',
        '--tb-activate-btn-hover-bg': 'rgba(26, 30, 62, 0.80)',
        '--tb-icon-filter': 'brightness(0)',
        // Platform-logo circle: white fill + white 50% 1px border on the light bar.
        '--tb-platform-logo-bg': '#FFFFFF',
        '--tb-platform-logo-border-c': 'rgba(255, 255, 255, 0.50)',
        '--tb-platform-logo-border-w': '1px',
    },
}

export const applyFramedColorVariant = (variant: string | undefined) => {
    const vars = variant ? VARIANT_VARS[variant] : undefined
    if (!vars) return
    const root = document.documentElement
    for (const [name, value] of Object.entries(vars)) root.style.setProperty(name, value)
}
