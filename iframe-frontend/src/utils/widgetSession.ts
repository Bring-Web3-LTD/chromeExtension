// One widget state per wallet. Several wallet extensions may embed this app on the same
// page, all from the same origin - so they share sessionStorage, and the platform name
// is what keeps each wallet's expand/collapse state separate.
export const widgetStorageKey = (platformName: string) => `bring:widget:${platformName}`

// Whether the widget starts this page load already expanded (persisted from a previous
// expansion in this tab session).
export const wasWidgetExpanded = (platformName: string) => {
    try {
        return sessionStorage.getItem(widgetStorageKey(platformName)) === 'true'
    } catch {
        /* sessionStorage may be unavailable (e.g. partitioned) - treat as collapsed */
        return false
    }
}
