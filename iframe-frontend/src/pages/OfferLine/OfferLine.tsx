import { useEffect } from 'react'
import { useRouteLoaderData } from 'react-router-dom'
import OfferLineOffer from '../../components/OfferLineOffer'
import { sendMessage, ACTIONS } from '../../utils/sendMessage'
import { iframeStyle } from '../../utils/iframeStyles'

const OfferLine = () => {
  const { platformName } = useRouteLoaderData('root') as LoaderData

  useEffect(() => {
    sendMessage({ action: ACTIONS.OPEN, style: iframeStyle[platformName.toLowerCase()] || iframeStyle['default'] })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <OfferLineOffer />
}

export default OfferLine
