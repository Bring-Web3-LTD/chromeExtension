import { useEffect, useRef } from "react"

/**
 * Escape dismisses the surface, doing exactly what the X button does.
 *
 * The listener sits on the iframe's OWN document - never the merchant page's - so the host
 * site keeps its Escape for its own modals and menus. It only reaches us once the user has
 * moved focus into the iframe.
 */
export const useEscape = (handler: () => void) => {
    // The close handlers close over state that changes between renders (isOptedOut,
    // status...), so bind the listener once and read the current handler through a ref.
    const handlerRef = useRef(handler)
    handlerRef.current = handler

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handlerRef.current()
        }

        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [])
}
