import { useEffect } from 'react'
import { useRouteLoaderData } from 'react-router-dom'
import OfferLineOffer from '../../components/OfferLineOffer'
import { sendMessage, ACTIONS } from '../../utils/sendMessage'
import { offerLineIframeStyle } from '../../utils/offerLineIframeStyles'
import { usePlatformStyles } from '../../hooks/usePlatformStyles'

const OfferLine = () => {
  const { platformName, offerlineDomain, themeMode, isOfferLine } = useRouteLoaderData('root') as LoaderData

  // Apply platform-specific styles dynamically
  usePlatformStyles(platformName, themeMode as 'light' | 'dark', isOfferLine || false)

  // Set body background to offerline-popup-bg
  useEffect(() => {
    const offerlineBg = getComputedStyle(document.documentElement).getPropertyValue('--offerline-popup-bg').trim()
    if (offerlineBg) {
      document.body.style.background = offerlineBg
    }
    return () => {
      document.body.style.background = ''
    }
  }, [platformName, themeMode])

  useEffect(() => {
    sendMessage({ action: ACTIONS.OPEN, style: offerLineIframeStyle[platformName.toLowerCase()] || offerLineIframeStyle['default'] })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Override padding for Amazon only - Google uses media queries from main.css
  useEffect(() => {
    if (offerlineDomain && offerlineDomain !== 'google.com') {
      document.documentElement.style.setProperty('--offerline-left-padding', '20px')
    }
  }, [offerlineDomain])

  return <OfferLineOffer />
}

export default OfferLine
