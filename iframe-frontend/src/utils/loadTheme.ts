import { themeNames, iframeStyleNames } from "./theme"
import loadFont from "./loadFont"

type ThemeData = Record<string, string> | { dark?: Record<string, string>; light?: Record<string, string> }

const fetchThemeData = async (url: string): Promise<ThemeData> => {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Failed to fetch theme: ${response.status}`)
    return await response.json()
}

/**
 * Extracts iframe-style entries from a resolved theme object using iframeStyleNames config.
 * Returns the extracted styles mapped to their camelCase style property names, and removes them from the input.
 */
const extractIframeStyle = (theme: Record<string, string>): Record<string, string> => {
    const extracted: Record<string, string> = {}
    for (const [themeKey, styleProp] of Object.entries(iframeStyleNames)) {
        if (themeKey in theme) {
            extracted[styleProp] = theme[themeKey]
            delete theme[themeKey]
        }
    }
    return extracted
}

/**
 * Resolves a theme JSON that may be flat or nested by mode.
 * Nested: { "dark": { ... }, "light": { ... } }
 * Flat: { "popupBg": "#...", ... }
 */
const resolveMode = (data: ThemeData, themeMode: string): Record<string, string> => {
    if ('dark' in data || 'light' in data) {
        const nested = data as { dark?: Record<string, string>; light?: Record<string, string> }
        return nested[themeMode as 'dark' | 'light'] || nested.dark || nested.light || {}
    }
    return data as Record<string, string>
}

const getLocalThemePath = (platformName: string): string => {
    return `${import.meta.env.BASE_URL}themes/${platformName.toUpperCase()}.json`
}

const getDefaultThemePath = (): string => {
    return `${import.meta.env.BASE_URL}themes/DEFAULT.json`
}

const applyTheme = (theme: Record<string, string>) => {
    Object.entries(theme).forEach(([key, value]) => {
        if (key === 'fontUrl' || key === 'fontFamily') return
        const cssVar = themeNames[key as keyof typeof themeNames]
        if (cssVar) {
            document.documentElement.style.setProperty(cssVar, value)
        }
    })
}

export interface LoadThemeResult {
    iframeStyle?: Record<string, string>
}

interface LoadThemeProps {
    theme?: ThemeData
    platformName: string
    themeMode: string
}

const loadTheme = async ({ theme, platformName, themeMode }: LoadThemeProps): Promise<LoadThemeResult> => {
    // Always load DEFAULT as the base
    let defaultTheme: Record<string, string> = {}
    try {
        const defaultData = await fetchThemeData(getDefaultThemePath())
        defaultTheme = resolveMode(defaultData, themeMode)
    } catch (error) {
        console.error('Failed to load default theme:', error)
    }

    // Get platform/remote theme to overlay on top
    let overrideTheme: Record<string, string> = {}

    if (theme && Object.keys(theme).length > 0) {
        overrideTheme = resolveMode(theme, themeMode)
    }

    // If no server-provided theme, try local platform-specific JSON
    if (Object.keys(overrideTheme).length === 0) {
        try {
            const localData = await fetchThemeData(getLocalThemePath(platformName))
            overrideTheme = resolveMode(localData, themeMode)
        } catch {
            // No platform-specific theme, DEFAULT alone will be used
        }
    }

    // Merge: DEFAULT first, then override with platform/remote values
    const resolvedTheme = { ...defaultTheme, ...overrideTheme }

    // Extract iframe-style keys before applying CSS variables
    const iframeStyle = extractIframeStyle(resolvedTheme)

    applyTheme(resolvedTheme)
    loadFont(resolvedTheme.fontUrl || null, resolvedTheme.fontFamily || null)

    return {
        iframeStyle: Object.keys(iframeStyle).length > 0 ? iframeStyle : undefined
    }
}

export default loadTheme
