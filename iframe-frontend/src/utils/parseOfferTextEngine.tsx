/* eslint-disable react-refresh/only-export-components */
import React from 'react'

export interface MarkerDef {
    type: 'highlight' | 'bold' | 'italic' | 'underline'
    open: string
    close: string
}

export interface ParsedMarker extends MarkerDef {
    startIdx: number
    endIdx: number
    content: string
}

export const MARKERS: MarkerDef[] = [
    { type: 'highlight', open: '<', close: '>' },
    { type: 'bold', open: '#', close: '#' },
    { type: 'italic', open: '/', close: '/' },
    { type: 'underline', open: '_', close: '_' }
]

// Define styles once - avoid recreation on every function call
const STYLES: Record<string, React.CSSProperties> = {
    highlight: { color: 'var(--details-amount-f-c)' },
    bold: { fontWeight: 'bold', color: 'var(--details-subtitle-f-c)' },
    italic: { fontStyle: 'italic', color: 'var(--details-subtitle-f-c)' },
    underline: { textDecoration: 'underline', color: 'var(--details-subtitle-f-c)' }
}

/**
 * Finds the first complete marker pair in the text
 * Returns the earliest marker by position
 */
export const findFirstMarker = (text: string): ParsedMarker | null => {
    let earliest: ParsedMarker | null = null
    let earliestStart = text.length

    for (const marker of MARKERS) {
        let searchStart = 0

        while (searchStart < text.length) {
            const openIdx = text.indexOf(marker.open, searchStart)
            if (openIdx === -1) break

            const closeStart = openIdx + marker.open.length
            const closeIdx = text.indexOf(marker.close, closeStart)

            if (closeIdx === -1) break

            // Ensure we have content between markers
            if (closeIdx > closeStart) {
                if (openIdx < earliestStart) {
                    earliestStart = openIdx
                    earliest = {
                        ...marker,
                        startIdx: openIdx,
                        endIdx: closeIdx,
                        content: text.substring(closeStart, closeIdx)
                    }
                }
                break // Found a valid marker for this type, move to next type
            }

            searchStart = openIdx + 1
        }
    }

    return earliest
}

let keyCounter = 0

export const resetKeyCounter = () => {
    keyCounter = 0
}

/**
 * Recursively parses text with nested formatting markers
 * Supports combinations like #<text># (bold + highlight)
 */
export const parseSegments = (text: string): React.ReactNode => {
    if (!text) return null

    const marker = findFirstMarker(text)

    if (!marker) {
        // No markers found, return as plain text
        return text
    }

    // Split text into parts: before marker, marker content, after marker
    const before = text.substring(0, marker.startIdx)
    const after = text.substring(marker.endIdx + marker.close.length)

    return (
        <>
            {before && parseSegments(before)}
            <span key={`marker-${keyCounter++}`} style={STYLES[marker.type]}>
                {parseSegments(marker.content)}
            </span>
            {after && parseSegments(after)}
        </>
    )
}
