/**
 * Type definitions and configuration for offer text parsing
 */

export type MarkerType = 'highlight' | 'bold' | 'italic' | 'underline'

/**
 * Style definitions for each marker type
 * Maps marker type to CSS properties using theme CSS variables
 */
export const STYLES = {
    highlight: { color: 'var(--details-amount-f-c)' },
    bold: { fontWeight: 'bold', color: 'var(--details-subtitle-f-c)' },
    italic: { fontStyle: 'italic', color: 'var(--details-subtitle-f-c)' },
    underline: { textDecoration: 'underline', color: 'var(--details-subtitle-f-c)' }
} as const

/**
 * Marker definitions: marker type -> [opening char, closing char]
 * 
 * Examples:
 * - <text> for highlight
 * - #text# for bold
 * - /text/ for italic
 * - _text_ for underline
 */
export const MARKERS = {
    highlight: ['<', '>'],
    bold: ['#', '#'],
    italic: ['/', '/'],
    underline: ['_', '_']
} as const
