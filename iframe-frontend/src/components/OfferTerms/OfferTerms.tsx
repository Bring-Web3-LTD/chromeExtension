import styles from './styles.module.css'
import { useEffect, useState } from 'react'
import { useRouteLoaderData } from 'react-router-dom'
import Markdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import { sendMessage, ACTIONS } from '../../utils/sendMessage'
import { useWalletAddress } from '../../hooks/useWalletAddress'
import { ENV } from '../../config'

interface Props {
    onBack: () => void;
}

const OfferTerms = ({ onBack }: Props) => {
    const { walletAddress } = useWalletAddress()
    const {
        platformName,
        topGeneralTermsUrl,
        retailerTermsUrl,
        generalTermsUrl
    } = useRouteLoaderData('root') as LoaderData

    const [markdownContent, setMarkdownContent] = useState('')

    useEffect(() => {
        const controller = new AbortController()

        const loadAllMarkdown = async () => {
            try {
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
            }
        }

        loadAllMarkdown()

        return () => controller.abort()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <>
            <button
                id="offer-terms-back-btn"
                className={styles.backBtn}
                onClick={onBack}
            >
                <div
                    id="offer-terms-back-icon"
                    className={styles.backIcon}
                    style={{
                        maskImage: `url(${import.meta.env.BASE_URL}icons/back-arrow.svg)`,
                        WebkitMaskImage: `url(${import.meta.env.BASE_URL}icons/back-arrow.svg)`
                    }}
                />
                <span id="offer-terms-back-label" className={styles.backLabel}>Back</span>
            </button>
            <div id="offer-terms-box" className={styles.termsBox}>
                <Markdown
                    className={styles.markdown}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                        a: ({ href, children, ...props }) => {
                            if (href?.startsWith('http')) {
                                const linkUrl = new URL(href)
                                linkUrl.searchParams.set('platform', platformName.toUpperCase())
                                linkUrl.searchParams.set('address', walletAddress || 'null')
                                if (ENV) {
                                    linkUrl.searchParams.set('env', ENV)
                                }
                                return (
                                    <span
                                        {...props}
                                        className={styles.externalLink}
                                        onClick={() => sendMessage({ action: ACTIONS.OPEN_CASHBACK_PAGE, url: linkUrl.toString() })}
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
        </>
    )
}

export default OfferTerms
