import styles from './styles.module.css'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouteLoaderData } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Offer from '../Offer/Offer'
import { sendMessage, ACTIONS } from '../../utils/sendMessage'
import { getIframeStyle } from '../../utils/iframeStyles'
import { useGoogleAnalytics } from '../../hooks/useGoogleAnalytics'

interface Props {
    closeFn: () => void
}

// collapsed     → idle badge (pulse)
// expanding     → AB card scaling up; badge still visible on top (fades out at the end)
// expanded      → full AB, badge hidden
// collapsingOut → AB card scaling down into the badge corner; badge visible again (faded in)
// The badge is shown whenever mode !== 'expanded', so it persists through both animations
// and only disappears at the end of expand / reappears at the start of collapse.
type Mode = 'collapsed' | 'expanding' | 'expanded' | 'collapsingOut'

const Widget = ({ closeFn }: Props) => {
    const { sendGaEvent } = useGoogleAnalytics()
    const {
        platformName,
        name,
        domain,
        version,
        widgetDefaultExpanded,
        iframeStyle: themeIframeStyle,
        zIndex,
    } = useRouteLoaderData('root') as LoaderData

    // Per-tab, per-(platform, domain) so independent wallets don't share state.
    const storageKey = useMemo(() => `bring:widget:${platformName}:${domain}`, [platformName, domain])

    const [mode, setMode] = useState<Mode>(() => {
        try {
            const stored = sessionStorage.getItem(storageKey)
            if (stored !== null) return stored === 'true' ? 'expanded' : 'collapsed'
        } catch {
            /* sessionStorage may be unavailable (e.g. partitioned) - fall back to config */
        }
        return widgetDefaultExpanded ? 'expanded' : 'collapsed'
    })

    // Falls back to the generic PlatformLogo (md) if a platform has no dedicated badge mark.
    const [markFailed, setMarkFailed] = useState(false)

    // The AB card is rendered while expanding, expanded, and collapsing back down.
    const showPopup = mode === 'expanding' || mode === 'expanded' || mode === 'collapsingOut'
    // The badge is visible whenever the AB is NOT fully expanded, so it persists through the
    // whole expand animation (disappears only at the end) and reappears at the start of the
    // collapse (staying while the AB shrinks). It sits on top, at the badge corner.
    const showBadge = mode !== 'expanded'
    // Iframe is popup-sized whenever the card is shown; the tiny badge iframe otherwise.
    const popupSized = showPopup

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
                    // Expand: grow from 0.6 at the badge corner (persisted-expanded loads at 1,
                    // no pop). Collapse: scale the whole card (bg + content) to nothing at the
                    // corner, staying opaque so content is visible the entire shrink.
                    initial={{ scale: mode === 'expanding' ? 0.6 : 1 }}
                    animate={{ scale: out ? 0 : 1 }}
                    transition={out
                        ? { duration: 0.35, ease: 'easeIn' }
                        : { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                    onAnimationComplete={() => {
                        if (mode === 'expanding') setMode('expanded')
                        else if (mode === 'collapsingOut') setMode('collapsed')
                    }}
                >
                    <Offer closeFn={closeFn} onCollapse={collapse} />
                </motion.div>
            )}
            {/* initial={false}: no fade on first page load.
                Later mounts (reappearing at collapse start) DO fade in; unmount at expand end
                fades out. */}
            <AnimatePresence initial={false}>
                {showBadge && (
                    <motion.div
                        key="badge"
                        id="bring-widget-collapsed"
                        className={styles.wrap}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                    >
                        <button
                            id="bring-widget-badge"
                            type="button"
                            // Idle pulse only while collapsed (CSS @keyframes); static during
                            // the expand/collapse transitions when the AB card scales instead.
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
                        {mode === 'collapsed' && (
                            <button
                                id="bring-widget-close"
                                type="button"
                                className={styles.close}
                                aria-label="Dismiss"
                                onClick={closeFn}
                            >
                                <span
                                    className={styles.closeIcon}
                                    style={{
                                        maskImage: `url(${import.meta.env.BASE_URL}icons/x-mark.svg)`,
                                        WebkitMaskImage: `url(${import.meta.env.BASE_URL}icons/x-mark.svg)`,
                                    }}
                                />
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

export default Widget
