import { useEffect } from "react"
import { sendMessage, ACTIONS } from "../../utils/sendMessage"
import { offerbarFramedStyle } from "../../utils/iframeStyles"
import { useRouteLoaderData } from "react-router-dom"

const Framed = () => {
    const { platformName } = useRouteLoaderData('root') as LoaderData

    useEffect(() => {
        sendMessage({ action: ACTIONS.OPEN, style: offerbarFramedStyle[platformName.toLowerCase()] || offerbarFramedStyle['default'] })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div style={{ width: '100vw', height: '100vh', background: 'magenta' }}>Framed</div>
    )
}

export default Framed