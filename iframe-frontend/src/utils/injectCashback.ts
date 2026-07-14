import formatCashback from './formatCashback'

/**
 * Replaces {{cashback}} marks in terms markdown with the retailer's formatted
 * cashback rate, so the mass-uploaded general MD can show per-retailer values
 * without manual edits. Markdown without the mark passes through unchanged.
 */
const CASHBACK_MARK = /\{\{\s*cashback\s*\}\}/gi

const injectCashback = (
    markdown: string,
    { maxCashback, cashbackSymbol, cashbackCurrency }: Pick<Info, 'maxCashback' | 'cashbackSymbol' | 'cashbackCurrency'>
): string =>
    markdown.replace(CASHBACK_MARK, formatCashback(+maxCashback, cashbackSymbol, cashbackCurrency))

export default injectCashback
