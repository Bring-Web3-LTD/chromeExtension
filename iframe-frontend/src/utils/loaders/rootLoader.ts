import { sendMessage, ACTIONS } from "../sendMessage"
import { keyFrames } from "../iframeStyles"
import verify from "../../api/verify"
// import { selectVariant } from "../ABTest/ABTestVariant"
import { selectVariant } from "../ABTest/platform-variants"
import { BASE_PATH, ENV } from "../../config"
import removeTrailingSlash from "../removeTrailingSlash"
import loadTheme from "../loadTheme"

interface Props {
    request: Request
}

const rootLoader = async ({ request }: Props) => {
    const url = new URL(decodeURI(request.url))
    const searchParams = url.searchParams
    const path = url.pathname
    const userId = searchParams.get('userId') || ''
    const styleUrl = searchParams.get('styleUrl') || null
    const themeMode = searchParams.get('themeMode') || 'light'

    const res = await verify({ token: searchParams.get('token'), userId, styleUrl, themeMode })
    if (res.status !== 200) throw `got ${res.status} code`

    // Apply theme: use server-fetched theme if available, otherwise fall back to local JSON
    const { iframeStyle } = await loadTheme({ theme: res.theme, platformName: res.info.platformName, themeMode })

    const variant = selectVariant(userId || res.info.walletAddress || '', res.info.platformName)
    // Argent Control: only load on base path

    if (variant === 'argentControl' && path !== removeTrailingSlash(BASE_PATH) && path !== '/') {
        return;
    }
    // Set open animation
    sendMessage({ action: ACTIONS.ADD_KEYFRAMES, keyFrames })

    const textMode = searchParams.get('textMode') || 'lower'
    const version = searchParams.get('v') || '0.0.0'
    const switchWallet = (searchParams.get('switchWallet') || 'false')?.toLowerCase() === 'true'

    // Verify token

    if (ENV === 'prod' && res.info.isTester) {
        res.info.isTester = false
    }

    return {
        ...res.info,
        version,
        userId,
        themeMode,
        textMode,
        switchWallet,
        iconsPath: `${import.meta.env.BASE_URL}${themeMode}/icons/${res.info.platformName.toUpperCase() || 'DEFAULT'}`,
        variant,
        iframeStyle
    }
}

export default rootLoader;