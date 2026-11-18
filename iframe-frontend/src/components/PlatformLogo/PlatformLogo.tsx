import { useState } from "react"
import { useRouteLoaderData } from "react-router-dom"

interface Props {
    platformName: string
    width?: number
    height?: number
    size?: 'sm' | 'md' | 'ob' | 'tb'
    // Optional AB-test variant suffix, e.g. 'c' → loads `${size}-c.svg`. On a
    // missing file the onError fallback drops to the platform DEFAULT logo.
    variant?: string
}

const PlatformLogo = ({ platformName, size = 'md', width, height, variant }: Props) => {
    const { themeMode } = useRouteLoaderData('root') as LoaderData
    const [useFallback, setUseFallback] = useState(false)

    const platform = useFallback ? 'DEFAULT' : platformName.toUpperCase()
    const suffix = variant && !useFallback ? `-${variant}` : ''
    const logoSrc = `${import.meta.env.BASE_URL}${themeMode}/images/logos/${platform}/${size}${suffix}.svg`

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