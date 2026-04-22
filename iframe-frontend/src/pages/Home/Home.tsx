import { useEffect } from 'react'
import { useRouteLoaderData } from 'react-router-dom'
import Offer from '../../components/Offer/Offer'
import OneStep from '../../templates/b/OneStep/OneStep'
import { sendMessage, ACTIONS } from '../../utils/sendMessage'
import { getIframeStyle } from '../../utils/iframeStyles'
import compareVersions from '../../utils/compareVersions'
import parseTime from '../../utils/parseTime'
import { THIRTY_MIN_MS } from '../../config'

const Home = () => {
  const { version, variant, platformName, domain, iframeStyle: themeIframeStyle } = useRouteLoaderData('root') as LoaderData

  useEffect(() => {
    sendMessage({ action: ACTIONS.OPEN, style: getIframeStyle('popup', platformName, themeIframeStyle) })
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

  return (
    <Offer
      closeFn={close}
    />
  )
}

export default Home
