import { useEffect } from 'react'
import { useRouteLoaderData } from 'react-router-dom'
import Offer from '../../components/Offer/Offer'
import Widget from '../../components/Widget/Widget'
import OneStep from '../../templates/b/OneStep/OneStep'
import { sendMessage, ACTIONS } from '../../utils/sendMessage'
import { useVariant } from '../../hooks/useVariant'
import { getIframeStyle } from '../../utils/iframeStyles'
import compareVersions from '../../utils/compareVersions'
import parseTime from '../../utils/parseTime'

const THIRTY_MIN_MS = 30 * 60 * 1000

const Home = () => {
  const { version, platformName, domain, iframeStyle: themeIframeStyle, zIndex, isWidgetEnabled } = useRouteLoaderData('root') as LoaderData
  const variant = useVariant('argent-onestep-v1')

  // When the collapsed widget is shown it owns the iframe sizing (small badge, then
  // resize on expand), so skip the popup OPEN here to avoid clobbering it.
  const showWidget = isWidgetEnabled && variant !== 'argentControl'

  useEffect(() => {
    if (showWidget) return
    sendMessage({ action: ACTIONS.OPEN, style: getIframeStyle('popup', platformName, version, themeIframeStyle, zIndex) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const close = () => {
    if (compareVersions(version, '1.2.6') !== 1) {
      sendMessage({ action: ACTIONS.ACTIVATE, url: `https://${domain}` })
    }
    sendMessage({ action: ACTIONS.CLOSE, domain, time: parseTime(THIRTY_MIN_MS, version) })
  }

  if (variant === 'argentControl') {
    return <>
      <OneStep />
    </>
  }

  if (showWidget) {
    return <Widget closeFn={close} />
  }

  return (
    <Offer
      closeFn={close}
    />
  )
}

export default Home
