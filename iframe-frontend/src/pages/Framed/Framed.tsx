import { useEffect } from "react"
import { sendMessage, ACTIONS } from "../../utils/sendMessage"
import { offerbarFramedStyle } from "../../utils/iframeStyles"
import { useRouteLoaderData } from "react-router-dom"
import styles from "./styles.module.css"

const Framed = () => {
    const { platformName } = useRouteLoaderData('root') as LoaderData

    useEffect(() => {
        const style = offerbarFramedStyle[platformName.toLowerCase()] || offerbarFramedStyle['default']
        console.log('style', style)
        sendMessage({ action: ACTIONS.OPEN, style })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div className={styles.frameContainer}>
            <div className={styles.topFrame}>
                <h3>Top Frame</h3>
            </div>

            <div className={styles.leftFrame}>
                <span>Left</span>
            </div>

            <div className={styles.rightFrame}>
                <span>Right</span>
            </div>

            <div className={styles.bottomFrame}>
                <p>Bottom Frame</p>
            </div>
        </div>
    )
}

export default Framed