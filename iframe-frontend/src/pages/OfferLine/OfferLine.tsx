import { useEffect } from 'react'
import { useRouteLoaderData } from 'react-router-dom'
import OfferLineOffer from '../../components/OfferLineOffer/OfferLineOffer'
import { sendMessage, ACTIONS } from '../../utils/sendMessage'
import { offerLineIframeStyle } from '../../utils/offerLineIframeStyles'

const OfferLine = () => {
  const { platformName, offerlineDomain } = useRouteLoaderData('root') as LoaderData

  useEffect(() => {
    document.body.dataset.page = 'offerline'
    sendMessage({ action: ACTIONS.OPEN, style: offerLineIframeStyle[platformName.toLowerCase()] || offerLineIframeStyle['default'] })
    // Override padding for Amazon only - Google uses media queries from main.css
    if (offerlineDomain && offerlineDomain !== 'google.com') {
      document.documentElement.style.setProperty('--offerline-left-padding', '20px')
    }
  }, [platformName])

  return <OfferLineOffer />
}

export default OfferLine
