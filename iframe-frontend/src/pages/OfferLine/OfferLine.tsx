import { useEffect } from 'react'
import { useRouteLoaderData } from 'react-router-dom'
import OfferLineOffer from '../../components/OfferLineOffer'
import { sendMessage, ACTIONS } from '../../utils/sendMessage'
import { offerLineIframeStyle } from '../../utils/offerLineIframeStyles'

const OfferLine = () => {
  const { platformName } = useRouteLoaderData('root') as LoaderData

  useEffect(() => {
    sendMessage({ action: ACTIONS.OPEN, style: offerLineIframeStyle[platformName.toLowerCase()] || offerLineIframeStyle['default'] })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <OfferLineOffer />
}

export default OfferLine
