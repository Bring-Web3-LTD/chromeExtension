import React from 'react'
import { parseSegments, resetKeyCounter } from './parseOfferTextEngine'

/**
 * Parses offer text with nested formatting markers:
 * - <text> = highlighted color
 * - #text# = bold
 * - /text/ = italic (tilted)
 * - _text_ = underlined
 * 
 * Supports nesting: #<4%># will be both bold and highlighted
 * Supports multiple nesting: /#<Hello world>#/ will be italic, bold, and highlighted
 * 
 * CSS variables should be defined in the theme files:
 * - --offer-text-f-c: base text color (fallback: --details-subtitle-f-c)
 * - --offer-text-highlight-f-c: highlighted text color (fallback: --details-amount-f-c)
 * 
 * @param text - The text to parse
 * @returns JSX element with formatted text
 */
const parseOfferText = (text: string | undefined): React.ReactNode => {
    if (!text) return null
    
    try {
        resetKeyCounter()
        const result = parseSegments(text)
        return result
    } catch (error) {
        console.error('Error parsing offer text:', error)
        return text // Fallback to plain text on error
    }
}

export default parseOfferText
