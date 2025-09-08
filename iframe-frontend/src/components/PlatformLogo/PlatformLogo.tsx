import { useRouteLoaderData } from "react-router-dom"

interface Props {
    platformName: string
    width?: number
    height?: number
    size?: 'sm' | 'md'
}

const PlatformLogo = ({ platformName, size = 'md', width = 108, height }: Props) => {
    const { themeMode } = useRouteLoaderData('root') as LoaderData

    return (
        <img
            src={`${import.meta.env.BASE_URL}${themeMode}/images/logos/${platformName.toUpperCase()}/${size}.svg`}
            alt="platform logo"
            width={width}
            height={height}
        />
    )
}

export default PlatformLogo