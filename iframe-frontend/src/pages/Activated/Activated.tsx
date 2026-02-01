import styles from './styles.module.css'
import { useEffect, useState } from 'react'
import { useRouteLoaderData } from 'react-router-dom'
import CloseBtn from '../../components/CloseBtn/CloseBtn'
import { useWalletAddress } from '../../hooks/useWalletAddress'
import splitWordMaxFive from '../../utils/splitWordMaxFive'
import toCapital from '../../utils/toCapital'
import Markdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import { sendMessage, ACTIONS } from '../../utils/sendMessage'
import { iframeStyle } from '../../utils/iframeStyles'
import { ENV } from '../../config'

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
        <div id="activated-container" className={styles.container}>
            <CloseBtn
                withTime={false}
            />
            <div id="activated-top-container" className={styles.top_container}>
                {walletAddress ? <div id="activated-wallet-container" className={styles.wallet_container}>
                    <span id="activated-wallet-address" className={styles.wallet}>{splitWordMaxFive(walletAddress)}</span>
                </div> : null}
            </div>
            <div id="activated-subcontainer" className={styles.subcontainer} >
                <img id="activated-icon" src={`${iconsPath}/activated.svg`} />
                <div id="activated-title" className={styles.title}>{tokenSymbol} cashback activated</div>
                <p id="activated-text" className={styles.p}>Reward approval may take up to 48 hours.</p>
                <div id="activated-backed-by" className={styles.backed_by}>Backed by {toCapital(platformName)} Wallet</div>
            </div>
            <Markdown 
                className={styles.markdown} 
                rehypePlugins={[rehypeRaw]}
                components={{
                    a: ({ href, children, ...props }) => {
                        if (href?.startsWith('http')) {
                            const url = new URL(href)
                            url.searchParams.set('platform', platformName.toUpperCase())
                            url.searchParams.set('address', walletAddress || 'null')
                            if (ENV) {
                                url.searchParams.set('env', ENV)
                            }
                            return (
                                <span
                                    {...props}
                                    className={styles.externalLink}
                                    onClick={() => sendMessage({ action: ACTIONS.OPEN_CASHBACK_PAGE, url: url.toString() })}
                                >
                                    {children}
                                </span>
                            )
                        }
                        return <a href={href} {...props}>{children}</a>
                    }
                }}
            >
                {markdownContent}
            </Markdown>
        </div>
    )
}

export default Activated