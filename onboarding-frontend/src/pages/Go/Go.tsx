import { useEffect } from 'react'
import NotFound from '../NotFound.tsx'
import { ONBOARDING_KEY, REDIRECT_HOSTS } from '../../config.ts'

// The campaign page links here on "download". We remember which campaign and click the
// visitor came from, then send them on to the Chrome Web Store. After install the extension
// kit opens this origin again and reads the values back. No UI.
const storeUrl = (value: string | null) => {
    if (!value) return null
    try {
        const url = new URL(value)
        return url.protocol === 'https:' && REDIRECT_HOSTS.includes(url.hostname) ? url.toString() : null
    } catch {
        return null
    }
}

const Go = () => {
    const params = new URLSearchParams(window.location.search)
    const redirect = storeUrl(params.get('redirect'))
    const campaignId = params.get('campaignId')
    const clickId = params.get('clickId')

    useEffect(() => {
        if (!redirect) return
        if (campaignId && clickId) {
            try {
                localStorage.setItem(ONBOARDING_KEY, JSON.stringify({ campaignId, clickId, ts: Date.now() }))
            } catch {
                // Storage blocked (private mode, site data off): the visitor still gets to the store.
            }
        }
        window.location.replace(redirect)
    }, [redirect, campaignId, clickId])

    return redirect ? null : <NotFound />
}

export default Go
