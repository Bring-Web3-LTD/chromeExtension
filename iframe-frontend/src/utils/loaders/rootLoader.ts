import { sendMessage, ACTIONS } from "../sendMessage"
import { keyFrames } from "../iframeStyles"
import verify from "../../api/verify"
import { ENV } from "../../config"
import loadTheme from "../loadTheme"

interface Props {
    request: Request
}

const rootLoader = async ({ request }: Props) => {
    const url = new URL(decodeURI(request.url))
    const searchParams = url.searchParams
    const userId = searchParams.get('userId') || ''
    const styleUrl = searchParams.get('styleUrl') || null
    const themeMode = searchParams.get('themeMode') || 'light'

    const res = await verify({ token: searchParams.get('token'), userId, styleUrl, themeMode })
    if (res.status !== 200) throw `got ${res.status} code`

    // Apply theme: use server-fetched theme if available, otherwise fall back to local JSON
    const { iframeStyle } = await loadTheme({ theme: res.theme, platformName: res.info.platformName, themeMode })

    // AB-test assignments are computed on the backend and returned by /verify.
    const testVariants = res.testVariants ?? {}
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
        testVariants,
        iframeStyle
    }
}

export default rootLoader;