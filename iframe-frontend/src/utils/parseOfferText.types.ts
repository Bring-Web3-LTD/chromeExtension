/**
 * Type definitions and configuration for offer text parsing
 */

export type MarkerType = 'highlight' | 'bold' | 'italic' | 'underline'

/**
 * Style definitions for each marker type
 * Maps marker type to CSS properties using theme CSS variables
 * 
 * Note: Only 'highlight' sets color. All other markers inherit color from parent
 * to allow proper color precedence when nested (e.g., <#text#> stays highlighted)
 */
export const STYLES = {
    highlight: { color: 'var(--details-amount-f-c)' },
    bold: { fontWeight: 'bold' },  // No color - inherit from parent
    italic: { fontStyle: 'italic' },  // No color - inherit from parent
    underline: { textDecoration: 'underline' }  // No color - inherit from parent
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
