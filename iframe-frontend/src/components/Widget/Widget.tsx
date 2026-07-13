import styles from './styles.module.css'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouteLoaderData } from 'react-router-dom'
import { motion } from 'framer-motion'
import Offer from '../Offer/Offer'
import { sendMessage, ACTIONS } from '../../utils/sendMessage'
import { getIframeStyle } from '../../utils/iframeStyles'
import { useGoogleAnalytics } from '../../hooks/useGoogleAnalytics'

interface Props {
    closeFn: () => void
}

// collapsed     → idle badge (pulse)
// expanding     → badge zooms out first; the AB card then scales up in its place
// expanded      → full AB, badge hidden
// collapsingOut → AB card zooms back down toward the badge corner; badge still hidden
// returning     → badge bounces back in, then the idle pulse resumes
type Mode = 'collapsed' | 'expanding' | 'expanded' | 'collapsingOut' | 'returning'

const Widget = ({ closeFn }: Props) => {
    const { sendGaEvent } = useGoogleAnalytics()
    const {
        platformName,
        name,
        domain,
        version,
        iframeStyle: themeIframeStyle,
        zIndex,
    } = useRouteLoaderData('root') as LoaderData

    // One widget state per wallet. Several wallet extensions may embed this app on the same
    // page, all from the same origin - so they share sessionStorage, and the platform name
    // is what keeps each wallet's expand/collapse state separate. No need to also key by
    // retailer: the browser already stores this iframe's data per top-level site (and per tab).
    const storageKey = useMemo(() => `bring:widget:${platformName}`, [platformName])

    const [mode, setMode] = useState<Mode>(() => {
        try {
            const stored = sessionStorage.getItem(storageKey)
            if (stored !== null) return stored === 'true' ? 'expanded' : 'collapsed'
        } catch {
            /* sessionStorage may be unavailable (e.g. partitioned) - start collapsed */
        }
        return 'collapsed'
    })

    // Falls back to the generic PlatformLogo (md) if a platform has no dedicated badge mark.
    const [markFailed, setMarkFailed] = useState(false)

    // The AB card is rendered while expanding, expanded, and collapsing back down.
    const showPopup = ['expanding', 'expanded', 'collapsingOut'].includes(mode)
    // Badge and AB run in sequence: the badge zooms out first (the AB starts growing just
    // before it finishes), and bounces back in only after the AB has zoomed out.
    const showBadge = mode === 'collapsed' || mode === 'expanding' || mode === 'returning'
    // Iframe stays popup-sized (big, un-clipped) through ALL transitions - including the
    // badge bounce-in (returning), whose 1.15 overshoot would otherwise get cut top-right
    // by the small iframe's clipPath. It shrinks to the tiny badge iframe only once fully
    // collapsed.
    const popupSized = mode !== 'collapsed'

    // Size the host iframe for the current surface.
    useEffect(() => {
        const page = popupSized ? 'widgetExpanded' : 'widget'
        const style = getIframeStyle(page, platformName, version, themeIframeStyle, zIndex)
        // The popup drop-shadow (theme `popupShadow` → iframe `boxShadow`) is shown ONLY
        // when fully expanded. During the grow/shrink the iframe is already full AB size,
        // so its shadow would hang AB-sized around the scaling card and only vanish when
        // the iframe finally resizes. Stripping it during the animation removes that.
        // getIframeStyle returns { iframe: {...} } (v1.6+) or a flat {...} (legacy); boxShadow
        // lives on whichever object carries the iframe-element props.
        const target = (style as { iframe?: Record<string, string> }).iframe ?? (style as Record<string, string>)
        if (mode !== 'expanded') target.boxShadow = 'none'
        // During the bounce-in the iframe is still full-size but nothing inside it is
        // actionable (badge/X clicks are guarded to 'collapsed'), so let the host page
        // receive clicks instead of the invisible iframe blocking them. Must be reset
        // explicitly in every other mode because applyStyles never clears keys.
        target.pointerEvents = mode === 'returning' ? 'none' : 'auto'
        sendMessage({ action: ACTIONS.OPEN, style })
    }, [mode, popupSized, platformName, version, themeIframeStyle, zIndex])

    // The iframe body defaults to the opaque popup background. Keep it opaque ONLY while
    // fully expanded - during the expand/collapse animations the body is transparent and the
    // .expanded card (which carries its own bg) scales over the page, so the whole AB grows
    // from / shrinks into the badge corner instead of a full-size body box lingering.
    useEffect(() => {
        const cls = 'bring-widget-collapsed'
        document.body.classList.toggle(cls, mode !== 'expanded')
        return () => document.body.classList.remove(cls)
    }, [mode])

    const expand = useCallback(() => {
        if (mode !== 'collapsed') return
        // Parity with existing AB events: retailer + domain are attached centrally by
        // the backend event path; we also include them in details for the GA4 payload.
        sendGaEvent('widget_click', {
            category: 'user_action',
            action: 'click',
            details: { retailer: name, domain },
        })
        try {
            sessionStorage.setItem(storageKey, 'true')
        } catch {
            /* ignore - expansion still works, it just won't persist across navigation */
        }
        setMode('expanding')
    }, [mode, sendGaEvent, name, domain, storageKey])

    // Widget-mode X/Close: collapse the AB back to the badge WITHOUT writing to
    // quietDomains. Suppression only happens via Pause / Activate, which keep standard behavior.
    const collapse = useCallback(() => {
        if (mode !== 'expanded') return
        try {
            sessionStorage.setItem(storageKey, 'false')
        } catch {
            /* ignore */
        }
        setMode('collapsingOut')
    }, [mode, storageKey])

    const out = mode === 'collapsingOut'

    return (
        <>
            {showPopup && (
                <motion.div
                    id="bring-widget-expanded"
                    key="popup"
                    className={styles.expanded}
                    // Expand: wait for the badge to zoom out (0.2s overlap), then grow from
                    // 0.6 at the badge corner (persisted-expanded loads at 1, no pop).
                    // Collapse: zoom the whole card back down to 0.6 while fading, then hand
                    // control back to the badge (returning).
                    initial={mode === 'expanding' ? { scale: 0.6, opacity: 0 } : { scale: 1, opacity: 1 }}
                    animate={out ? { scale: 0.6, opacity: 0 } : { scale: 1, opacity: 1 }}
                    transition={out
                        ? { duration: 0.3, ease: 'easeIn' }
                        : {
                            // No overshoot here (unlike the badge bounce): the card is exactly
                            // the iframe's width and anchored top-right, so any scale > 1 pushes
                            // content past the clipped left edge and reads as a glitch.
                            scale: { delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
                            opacity: { delay: 0.2, duration: 0.3 },
                        }}
                    onAnimationComplete={() => {
                        if (mode === 'expanding') setMode('expanded')
                        else if (mode === 'collapsingOut') setMode('returning')
                    }}
                >
                    <Offer closeFn={closeFn} onCollapse={collapse} />
                </motion.div>
            )}
            {showBadge && (
                // The whole wrap (badge + its X) zooms out on expand and bounces back in on
                // return, so the X moves as one piece with the widget.
                <motion.div
                    id="bring-widget-collapsed"
                    className={styles.wrap}
                    // Mounting mid-collapse (returning) starts the bounce from 0; the first
                    // mount while collapsed renders in place with no animation.
                    initial={mode === 'returning' ? { scale: 0, opacity: 0 } : false}
                    animate={mode === 'expanding'
                        ? { scale: 0, opacity: 0 }
                        : mode === 'returning'
                            ? { scale: [0, 1.15, 0.95, 1], opacity: [0, 1, 1, 1] }
                            : { scale: 1, opacity: 1 }}
                    transition={mode === 'expanding'
                        ? { duration: 0.35, ease: 'easeIn' }
                        : mode === 'returning'
                            ? { duration: 0.6, times: [0, 0.6, 0.8, 1], ease: 'easeOut' }
                            : { duration: 0 }}
                    onAnimationComplete={() => {
                        if (mode === 'returning') setMode('collapsed')
                    }}
                >
                    <button
                        id="bring-widget-badge"
                        type="button"
                        // Idle pulse only while collapsed (CSS @keyframes) - it lives on the
                        // button so it can't fight framer's transform on the wrap.
                        className={`${styles.badge}${mode === 'collapsed' ? ` ${styles.pulse}` : ''}`}
                        aria-label="Open cashback offer"
                        onClick={expand}
                    >
                        <span className={styles.logo}>
                            <img
                                src={`${import.meta.env.BASE_URL}icons/platforms/widget/${markFailed ? 'DEFAULT' : platformName.toUpperCase()}.svg`}
                                alt=""
                                // Guarded so a missing DEFAULT.svg can't loop the error.
                                onError={() => { if (!markFailed) setMarkFailed(true) }}
                            />
                        </span>
                    </button>
                    <button
                        id="bring-widget-close"
                        type="button"
                        className={styles.close}
                        aria-label="Dismiss"
                        // Stays mounted through the transitions so it scales with the badge,
                        // but is only actionable once fully collapsed.
                        onClick={() => { if (mode === 'collapsed') closeFn() }}
                    >
                        <span
                            className={styles.closeIcon}
                            style={{
                                maskImage: `url(${import.meta.env.BASE_URL}icons/x-mark.svg)`,
                                WebkitMaskImage: `url(${import.meta.env.BASE_URL}icons/x-mark.svg)`,
                            }}
                        />
                    </button>
                </motion.div>
            )}
        </>
    )
}

export default Widget
