import { sendMessage, ACTIONS } from "../sendMessage"
import { keyFrames } from "../iframeStyles"
import loadFont from "../loadFont"
import verify from "../../api/verify"
// import { selectVariant } from "../ABTest/ABTestVariant"
import { selectVariant } from "../ABTest/platform-variants"
import { BASE_PATH, ENV } from "../../config"

interface Props {
    request: Request
}

const rootLoader = async ({ request }: Props) => {
    const url = new URL(decodeURI(request.url))
    const searchParams = url.searchParams
    const path = url.pathname
    const userId = searchParams.get('userId') || ''

    const res = await verify({ token: searchParams.get('token'), userId })
    if (res.status !== 200) throw `got ${res.status} code`

    const variant = selectVariant(userId || res.info.walletAddress || '', res.info.platformName)
    // Argent Control: only load on base path
    if (variant === 'argentControl' && path !== BASE_PATH) {
        return;
    }
    // Set open animation
    sendMessage({ action: ACTIONS.ADD_KEYFRAMES, keyFrames })

    const textMode = searchParams.get('textMode') || 'lower'
    const themeMode = searchParams.get('themeMode') || 'light'
    const version = searchParams.get('v') || '0.0.0'
    const switchWallet = (searchParams.get('switchWallet') || 'false')?.toLowerCase() === 'true'

    // Load chosen font
    loadFont(searchParams.get('t_fontUrl'), searchParams.get('t_fontFamily'))
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
        variant
    }
}

export default rootLoader;