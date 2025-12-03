import { useEffect } from 'react'
import { applyPlatformStyles } from '../utils/platformStyles'

/**
 * Hook to apply platform-specific styles for OfferLine
 * This hook should only be used in OfferLine pages
 * 
 * @param platformName - The platform name from server (yoroi, cspr, ecko, fuel)
 * @param themeMode - The theme mode (light or dark)
 * @param isOfferLine - Whether this is an OfferLine page
 */
export const usePlatformStyles = (
    platformName: string | undefined, 
    themeMode: 'light' | 'dark' | undefined,
    isOfferLine: boolean
) => {
    useEffect(() => {
        // Only apply styles for OfferLine pages
        if (!isOfferLine || !platformName || !themeMode) {
            return
        }

        applyPlatformStyles(platformName, themeMode)
    }, [platformName, themeMode, isOfferLine])
}
