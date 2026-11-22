import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import NotFound from '../NotFound.tsx'
import GeoBlock from '../../components/GeoBlock/GeoBlock.tsx'
import { API_ENDPOINT, API_KEY, ONBOARDING_KEY, REDIRECT_HOSTS } from '../../config.ts'

// `/go/<campaignId>?cid=<click id>`: the link a publisher gets for an extension (CAB)
// campaign. No UI. Bring's API checks the campaign is active, records the click and
// returns the Chrome Web Store page of the campaign's extension. We remember which
// campaign and click the visitor came from, then send them on to the store. After
// install the extension kit opens this origin again and reads the values back.
//
// An unknown, paused or non-extension campaign, or any failure, shows the 404. A
// campaign whose platform is not live in the visitor's country shows the not-live screen.
const CAMPAIGN_ID_RE = /^[0-9A-Za-z]{5}$/

const storeUrl = (value: unknown) => {
    if (typeof value !== 'string') return null
    try {
        const url = new URL(value)
        return url.protocol === 'https:' && REDIRECT_HOSTS.includes(url.hostname) ? url.toString() : null
    } catch {
        return null
    }
}

const resolveStoreUrl = async (campaignId: string, clickId: string | null, signal: AbortSignal) => {
    const res = await fetch(`${API_ENDPOINT}/auth/campaign-link/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
        body: JSON.stringify({ campaignId, ...(clickId && { clickId }) }),
        signal,
    })
    if (!res.ok) throw new Error(`campaign resolve failed: ${res.status}`)
    const body = await res.json()
    // Not live in the visitor's country (TODO#802): no store URL, the not-live screen instead
    if (body?.isCountryAvailable === false) return null
    const url = storeUrl(body?.storeUrl)
    if (!url) throw new Error('campaign has no store page')
    return url
}

const Go = () => {
    const { campaignId = '' } = useParams()
    const clickId = new URLSearchParams(window.location.search).get('cid')
    const [failed, setFailed] = useState(!CAMPAIGN_ID_RE.test(campaignId))
    const [geoBlocked, setGeoBlocked] = useState(false)

    useEffect(() => {
        if (!CAMPAIGN_ID_RE.test(campaignId)) return
        // Abort on unmount / StrictMode's dev-only double effect, so a stale
        // response can't redirect after the fact
        const controller = new AbortController()
        resolveStoreUrl(campaignId, clickId, controller.signal)
            .then((url) => {
                if (!url) {
                    setGeoBlocked(true)
                    return
                }
                // No click id, no attribution: the visitor still gets to the store
                if (clickId) {
                    try {
                        localStorage.setItem(ONBOARDING_KEY, JSON.stringify({ campaignId, clickId, ts: Date.now() }))
                    } catch {
                        // Storage blocked (private mode, site data off): the visitor still gets to the store.
                    }
                }
                window.location.replace(url)
            })
            .catch((err) => {
                if (controller.signal.aborted) return
                console.warn('campaign link failed', campaignId, err)
                setFailed(true)
            })
        return () => controller.abort()
    }, [campaignId, clickId])

    // The live region is there from the first render, so the 404 that replaces the
    // empty page after a failed resolve is announced to screen readers
    return <div aria-live="polite">{failed ? <NotFound /> : geoBlocked ? <GeoBlock /> : null}</div>
}

export default Go
