import { useEffect, useState } from "react"
import { useSearchParams } from "./useSearchParams"
import { themeNames } from "../utils/theme"

const getThemeParams = (params: Record<string, string>) => {
    const theme: Record<string, string> = {}
    Object.entries(params).map(([key, value]) => {
        if (key.startsWith('t_')) theme[key.replace('t_', '')] = value
    })
    return theme
}

interface ThemeParamsResult {
    done: boolean
}

const useCustomTheme = (): ThemeParamsResult => {
    const { getAllParams } = useSearchParams()
    const theme = getThemeParams(getAllParams())
    const [done, setDone] = useState(false)

    useEffect(() => {
        // Apply custom theme
        Object.entries(theme).map(([key, value]) => {
            if (themeNames[key]) {
                document.documentElement.style.setProperty(themeNames[key], value)
            }
        })
        setDone(true)
    }, [theme])

    return { done }
}

export default useCustomTheme