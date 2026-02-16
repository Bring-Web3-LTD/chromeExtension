import React from 'react'
import { STYLES, MARKERS, MarkerType } from './parseOfferText.types'

/**
 * Parses offer text with nested formatting markers:
 * - <text> = highlighted (uses --details-amount-f-c color)
 * - #text# = bold (uses --details-subtitle-f-c color)
 * - /text/ = italic (uses --details-subtitle-f-c color)
 * - _text_ = underlined (uses --details-subtitle-f-c color)
 * 
 * Supports nesting: #<4%># will be both bold and highlighted
 * Supports multiple nesting: /#<Hello world>#/ will be italic, bold, and highlighted
 * 
 * Example: "Buy <#4%#> in /ADA/" renders as:
 * - "Buy " in default color
 * - "4%" in bold + highlighted
 * - " in " in default color
 * - "ADA" in italic
 * 
 * @param text - The text to parse with markers
 * @returns JSX element with formatted text, or null if no text
 */
const parseOfferText = (text: string | undefined): React.ReactNode => {
    if (!text) return null

    try {
        return parseText(text)
    } catch (error) {
        console.error('Error parsing offer text:', error)
        return text // Fallback to plain text on error
    }
}
let keyCounter = 0

/**
 * Finds the first marker pair in text and returns its position/content
 */
function findFirstMarker(text: string): {
    type: MarkerType
    startIdx: number
    endIdx: number
    content: string
} | null {
    let earliest: ReturnType<typeof findFirstMarker> = null
    let earliestStart = text.length

    for (const [type, [open, close]] of Object.entries(MARKERS)) {
        let searchStart = 0

        while (searchStart < text.length) {
            const openIdx = text.indexOf(open, searchStart)
            if (openIdx === -1) break

            const closeStart = openIdx + open.length
            const closeIdx = text.indexOf(close, closeStart)

            if (closeIdx === -1 || closeIdx === closeStart) {
                searchStart = openIdx + 1
                continue
            }

            if (openIdx < earliestStart) {
                earliestStart = openIdx
                earliest = {
                    type: type as MarkerType,
                    startIdx: openIdx,
                    endIdx: closeIdx,
                    content: text.substring(closeStart, closeIdx)
                }
            }
            break
        }
    }

    return earliest
}

/**
 * Recursively parses text, applying styles for each marker found
 */
function parseText(text: string): React.ReactNode {
    const marker = findFirstMarker(text)

    if (!marker) {
        return text // No markers found
    }

    const before = text.substring(0, marker.startIdx)
    const after = text.substring(marker.endIdx + MARKERS[marker.type][1].length)

    return (
        <>
            {before && parseText(before)}
            <span key={`m${keyCounter++}`} style={STYLES[marker.type]}>
                {parseText(marker.content)}
            </span>
            {after && parseText(after)}
        </>
    )
}

export default parseOfferText
