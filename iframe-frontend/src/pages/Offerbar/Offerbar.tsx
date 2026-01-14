import styles from './styles.module.css'
import { useEffect, useState, useCallback } from "react"
import { sendMessage, ACTIONS } from "../../utils/sendMessage"
import { offerbarStyle } from "../../utils/iframeStyles"
import { useRouteLoaderData } from "react-router-dom"
import Logos from './Logos/Logos'
import toCaseString from '../../utils/toCaseString'
import formatCashback from '../../utils/formatCashback'
import Optout from './Optout/Optout'
import parseTime from '../../utils/parseTime'
import { useGoogleAnalytics } from '../../hooks/useGoogleAnalytics'
import { useWalletAddress } from '../../hooks/useWalletAddress'
import activate from '../../api/activate'
import { ACTIVATE_QUIET_TIME } from '../../config'

const THIRTY_MIN_MS = 30 * 60 * 1000

const Offerbar = () => {
  const { 
    platformName, 
    iconsPath, 
    textMode, 
    domain, 
    cryptoSymbols, 
    maxCashback, 
    cashbackSymbol, 
    cashbackCurrency, 
    version,
    flowId,
    name,
    userId,
    retailerId,
    url,
  } = useRouteLoaderData('root') as LoaderData
  const [showOptout, setShowOptout] = useState(false)
  const [isActivating, setIsActivating] = useState(false)
  const { sendGaEvent } = useGoogleAnalytics()
  const { walletAddress } = useWalletAddress()

  const close = async () => {
    await sendGaEvent('popup_close', {
      category: 'user_action',
      action: 'click',
      details: 'extension'
    })
    sendMessage({ action: ACTIONS.CLOSE, domain, time: parseTime(THIRTY_MIN_MS, version) })
  }

  const handleActivate = useCallback(async () => {
    if (isActivating || !walletAddress) {
      if (!walletAddress) {
        sendMessage({ action: ACTIONS.PROMPT_LOGIN })
      }
      return
    }

    setIsActivating(true)

    const body: Parameters<typeof activate>[0] = {
      walletAddress,
      platformName,
      retailerId,
      url,
      userId,
      tokenSymbol: cryptoSymbols[0],
      flowId,
    }

    const { status, url: redirectUrl, iframeUrl, token } = await activate(body)

    if (status !== 200) {
      setIsActivating(false)
      return
    }

    sendMessage({
      action: ACTIONS.ACTIVATE,
      url,
      domain,
      time: parseTime(ACTIVATE_QUIET_TIME, version),
      redirectUrl,
      iframeUrl,
      token,
      flowId,
      platformName
    })

    sendGaEvent('retailer_shop', {
      category: 'user_action',
      action: 'click',
      details: name
    })

    setIsActivating(false)
  }, [isActivating, walletAddress, platformName, retailerId, url, userId, cryptoSymbols, flowId, domain, version, sendGaEvent, name])

  useEffect(() => {
    sendMessage({ action: ACTIONS.OPEN, style: offerbarStyle[platformName.toLowerCase()] || offerbarStyle['default'] })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      id="offerbar-container"
      className={styles.offerbar}
      style={{ backgroundImage: `url(${iconsPath}/ob-bg.png)` }}
    >
      <button id="offerbar-close-btn-top" className={styles.closeButton} onClick={close}><img src={`${iconsPath}/ob-close-btn.svg`} alt="Close" /></button>
      {showOptout ? <Optout closeFn={() => setShowOptout(false)} />
        :
        <>
          <div id="offerbar-spacer" className={styles.spacer}></div>
          <Logos />
          <div id="offerbar-offer-text-container" className={styles.offer_text_container}>
            <div id="offerbar-offer-text-up-to" className={styles.offer_text}>Up to</div>
            <div id="offerbar-cashback-amount" className={styles.offer_amount}>{formatCashback(+maxCashback, cashbackSymbol, cashbackCurrency)}</div>
            <div id="offerbar-crypto-symbol" className={styles.offer_amount}>{cryptoSymbols[0]}</div>
            <div id="offerbar-offer-text-cashback" className={styles.offer_text}>Cashback</div>
          </div>
          <button id="offerbar-activate-btn" className={styles.activateButton} onClick={handleActivate} disabled={isActivating}>
            {toCaseString(isActivating ? 'Activating...' : 'Activate', textMode)}
          </button>
          <button
            id="offerbar-opt-out-btn"
            className={styles.optOutButton}
            onClick={() => setShowOptout(true)}
          >{toCaseString('Opt out', textMode)}</button>
        </>
      }
      <button id="offerbar-close-btn-bottom" className={styles.closeButtonBottom} onClick={close}>
        <img src={`${iconsPath}/close-icon.svg`} alt="" />
        <span id="offerbar-close-text">
          {toCaseString('Close', textMode)}
        </span>
      </button>
    </div>
  )
}

export default Offerbar