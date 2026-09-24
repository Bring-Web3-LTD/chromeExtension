import { useEffect } from "react"

/**
 * Keeps keyboard focus inside the surface when a panel opens or swaps its contents,
 * then hands it back to the trigger on close.
 *
 * Focus lands on the body, like when the surface first appears: nothing is pre-selected and
 * nothing takes a focus ring, but Tab keeps working inside the popup instead of leaving it.
 * Deliberately NOT a focus trap - Tab still reaches the merchant page.
 *
 * `key` re-runs the focus when a panel swaps its contents in place (Apply -> confirmation).
 */
export const useFocusPanel = (returnFocusId: string, key?: unknown) => {
    useEffect(() => {
        document.body.tabIndex = -1
        document.body.focus()
    }, [key])

    useEffect(() => {
        return () => {
            // The trigger remounts with the panel's exit animation, so an element reference
            // captured on open would be stale by now - re-query it by id.
            requestAnimationFrame(() => document.getElementById(returnFocusId)?.focus())
        }
    }, [returnFocusId])
}
