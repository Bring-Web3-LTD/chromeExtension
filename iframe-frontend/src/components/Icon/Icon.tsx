import { useState } from 'react'
import { useRouteLoaderData } from 'react-router-dom'

interface Props {
    name: string
    alt?: string
    className?: string
    width?: number | string
    height?: number | string
    id?: string
}

const Icon = ({ name, alt = '', className, width, height, id }: Props) => {
    const { iconsPath, themeMode } = useRouteLoaderData('root') as LoaderData
    const [useFallback, setUseFallback] = useState(false)
    
    const basePath = useFallback 
        ? `${import.meta.env.BASE_URL}${themeMode}/icons/DEFAULT`
        : iconsPath
    
    const iconSrc = `${basePath}/${name}`

    const handleError = () => {
        if (!useFallback) {
            setUseFallback(true)
        }
    }

    return (
        <img
            id={id}
            src={iconSrc}
            alt={alt}
            className={className}
            width={width}
            height={height}
            onError={handleError}
        />
    )
}

export default Icon
