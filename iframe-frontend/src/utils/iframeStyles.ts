import compareVersions from "./compareVersions"

interface Styles {
    [key: string]: { [key: string]: { [key: string]: string } }
}

interface KeyFrames {
    [key: string]: string
}

export type IframePage = 'popup' | 'offerbar' | 'offerbarFramed' | 'notification' | 'widget' | 'widgetExpanded'

const iframeStyle: Styles = {
    default: {
        iframe: {
            animation: 'slideIn .3s ease-in-out',
            width: '480px',
            height: `435px`,
            borderRadius: '8px',
            display: 'block',
            top: '10px'
        }
    },
    yoroi: {
        iframe: {
            animation: 'slideIn .3s ease-in-out',
            width: '480px',
            height: `436px`,
            borderRadius: '16px',
            display: 'block',
            top: '10px'
        }
    },
    argent: {
        iframe: {
            animation: 'slideIn .3s ease-in-out',
            width: '360px',
            height: `600px`,
            borderRadius: '0px',
            display: 'block',
            top: '10px'
        }
    }
}

const offerbarStyle: Styles = {
    default: {
        iframe: {
            animation: 'slideIn .3s ease-in-out',
            width: '93px',
            height: `482px`,
            borderRadius: '100px 0 0 100px',
            display: 'block',
            top: '144px',
            right: '0px'
        }
    }
}

const offerbarFramedStyle: Styles = {
    default: {
        iframe: {
            position: 'fixed',
            inset: '0',
            animation: 'slideIn .3s ease-in-out',
            height: '71px',
            width: `100vw`,
            borderRadius: '0px',
            pointerEvents: 'auto',
        }
    }
}

// Collapsed widget badge. The iframe is small (only the badge + its close overhang
// are visible) and transparent, anchored to the viewport top-right,
// position fixed, top 129px, right 15px, doesn't scroll.
// The idle "pulse" animation lives inside the iframe (framer-motion), so no CSS
// animation here.
const widgetStyle: Styles = {
    default: {
        iframe: {
            width: '80px',
            height: '80px',
            // The 80x80 iframe has an 8px inset around the 64px badge (room for the
            // close overhang + the 1.07 idle pulse). Offset by 8px from the Figma
            // badge position (top 129, right 15) so the badge itself lands there.
            top: '121px',
            right: '7px',
            borderRadius: '0px',
            border: 'none',
            background: 'transparent',
            display: 'block',
            animation: 'none',
            // Only the badge circle + the close button (tucked on the badge's top-right
            // edge) are hit-testable; the rest of the 80x80 box passes clicks through to
            // the host page. The 80x80 layout: badge center (40,40) r32 (35 to clear the
            // 1.07 pulse), close center (68,21) r8 (9 for headroom). Compound region.
            clipPath: "path('M5,40 a35,35 0 1,0 70,0 a35,35 0 1,0 -70,0 M59,21 a9,9 0 1,0 18,0 a9,9 0 1,0 -18,0')",
        }
    }
}

// Widget expanded into the full AB. The expanded surface IS the standard popup
// (same per-platform dimensions), so we derive it from `iframeStyle` rather than
// duplicating sizes - only the deltas differ:
//  - top/right: anchored at the badge position so the AB grows out of the badge.
//  - animation: the scale/fade is done inside the iframe (framer-motion), so the
//    CSS slideIn is disabled.
//  - clipPath: cleared, since applyStyles only sets keys (never clears them) and the
//    collapsed badge's clip would otherwise linger and crop the AB.
const applyIframeOverrides = (styles: Styles, overrides: Record<string, string>): Styles => {
    const result: Styles = {}
    for (const [platform, value] of Object.entries(styles)) {
        result[platform] = { iframe: { ...value.iframe, ...overrides } }
    }
    return result
}

// Anchored at the SAME top/right as the collapsed `widget` iframe so the badge (which
// stays visible through the expand/collapse animations) never shifts when the iframe
// resizes. The AB card's own top-right corner sits at the badge, so it grows from /
// shrinks into it.
const widgetExpandedStyle: Styles = applyIframeOverrides(iframeStyle, {
    top: '121px',
    right: '7px',
    animation: 'none',
    clipPath: 'none',
})

const notificationIframeStyle: Styles = {
    default: {
        iframe: {
            animation: 'slideIn .3s ease-in-out',
            width: '480px',
            height: `56px`,
            borderRadius: '10px',
            display: 'block',
            top: '40px'
        }

    },
    yoroi: {
        iframe: {
            animation: 'slideIn .3s ease-in-out',
            width: '480px',
            height: `56px`,
            borderRadius: '12px',
            display: 'block',
            top: '40px'
        }

    },
    argent: {
        iframe: {
            animation: 'slideIn .3s ease-in-out',
            width: '400px',
            height: `50px`,
            borderRadius: '10px',
            display: 'block',
            top: '40px'
        }
    }
}

export const keyFrames: KeyFrames[] =
    [
        {
            name: 'slideIn',
            rules:
                `from {
        right: -300px;
      }
      to {
        right: 8px;
      }`
        }
    ]

const styleMap: Record<IframePage, Styles> = {
    popup: iframeStyle,
    offerbar: offerbarStyle,
    offerbarFramed: offerbarFramedStyle,
    notification: notificationIframeStyle,
    widget: widgetStyle,
    widgetExpanded: widgetExpandedStyle,
}

/**
 * Returns the merged iframe style for a given page type and platform.
 * Combines the hardcoded base style with any theme-provided overrides.
 */
export const getIframeStyle = (
    page: IframePage,
    platformName: string,
    version: string,
    themeIframeStyle?: Record<string, string>,
    zIndex?: number,
): { [key: string]: { [key: string]: string } } | { [key: string]: string } => {
    const styles = styleMap[page]
    const baseIframeStyle = styles[platformName.toLowerCase()] || styles['default']
    const isLegacy = compareVersions(version, '1.6.0') === -1

    // Server-driven per-platform stacking priority: just another iframe-style override
    const iframeStyleOverrides = zIndex !== undefined
        ? { ...themeIframeStyle, zIndex: String(zIndex) }
        : themeIframeStyle

    if (isLegacy) {
        return iframeStyleOverrides
            ? { ...baseIframeStyle.iframe, ...iframeStyleOverrides }
            : baseIframeStyle.iframe
    }

    return iframeStyleOverrides
        ? { iframe: { ...baseIframeStyle.iframe, ...iframeStyleOverrides } }
        : baseIframeStyle
}