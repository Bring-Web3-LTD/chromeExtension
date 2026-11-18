/** The default token's display name ('PAX Gold') when the backend sends one, else its symbol. */
const tokenLabel = ({ cryptoSymbols, cryptoTokens }: Pick<Info, 'cryptoSymbols' | 'cryptoTokens'>): string =>
    cryptoTokens?.find(t => t.symbol === cryptoSymbols[0])?.displayName ?? cryptoSymbols[0]

export default tokenLabel
