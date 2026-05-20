import { useState } from "react"
import { useRouteLoaderData } from "react-router-dom"

interface Props {
    platformName: string
    width?: number
    height?: number
    size?: 'sm' | 'md' | 'ob' | 'tb'
}

const PlatformLogo = ({ platformName, size = 'md', width, height }: Props) => {
    const { themeMode } = useRouteLoaderData('root') as LoaderData
    const [useFallback, setUseFallback] = useState(false)
    
    const platform = useFallback ? 'DEFAULT' : platformName.toUpperCase()
    const logoSrc = `${import.meta.env.BASE_URL}${themeMode}/images/logos/${platform}/${size}.svg`

    const handleError = () => {
        if (!useFallback) {
            setUseFallback(true)
        }
    }

    return (
        <img
            id="platform-logo"
            src={logoSrc}
            alt="platform logo"
            width={width || 'auto'}
            height={height}
            onError={handleError}
        />
    )
}

export default PlatformLogo