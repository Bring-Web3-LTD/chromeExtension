import styles from './styles.module.css'
import { useEffect, useState } from 'react'
import { useRouteLoaderData } from 'react-router-dom'
import CloseBtn from '../../components/CloseBtn/CloseBtn'
import { useWalletAddress } from '../../hooks/useWalletAddress'
import splitWordMaxFive from '../../utils/splitWordMaxFive'
import toCapital from '../../utils/toCapital'
import Markdown from 'react-markdown'
import { sendMessage, ACTIONS } from '../../utils/sendMessage'
import { iframeStyle } from '../../utils/iframeStyles'

const Activated = () => {
    const { topGeneralTermsUrl, retailerTermsUrl, generalTermsUrl, platformName, iconsPath, tokenSymbol } = useRouteLoaderData('root') as ActivatedData
    const { walletAddress } = useWalletAddress()
    const [markdownContent, setMarkdownContent] = useState('')
    // const [loading, setLoading] = useState(true)

    useEffect(() => {
        const controller = new AbortController()

        sendMessage({ action: ACTIONS.OPEN, style: iframeStyle[platformName.toLowerCase()] || iframeStyle['default'] })

        const loadAllMarkdown = async () => {
            try {
                // setLoading(true)
                const [topGeneral, retailer, general] = await Promise.all([
                    fetch(topGeneralTermsUrl, { signal: controller.signal }).then(res => res.text()),
                    fetch(retailerTermsUrl, { signal: controller.signal }).then(res => res.text()),
                    fetch(generalTermsUrl, { signal: controller.signal }).then(res => res.text())
                ])

                setMarkdownContent(topGeneral + retailer + general)
            } catch (error: unknown) {
                if (error instanceof Error && error.name !== 'AbortError') {
                    console.error("Error fetching markdown:", error)
                }
            } finally {
                // setLoading(false)
            }
        }

        loadAllMarkdown()

        return () => controller.abort()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div className={styles.container}>
            <CloseBtn
                withTime={false}
            />
            <div className={styles.top_container}>
                {walletAddress ? <div className={styles.wallet_container}>
                    <span className={styles.wallet}>{splitWordMaxFive(walletAddress)}</span>
                </div> : null}
            </div>
            <div className={styles.subcontainer} >
                <img src={`${iconsPath}/activated.svg`} />
                <div className={styles.title}>{tokenSymbol} cashback activated</div>
                <p className={styles.p}>Reward approval may take up to 48 hours.</p>
                <div className={styles.backed_by}>Backed by {toCapital(platformName)} Wallet</div>
            </div>
            <Markdown className={styles.markdown}>
                {markdownContent}
            </Markdown>
        </div>
    )
}

export default Activated