const formatCashback = (amount: number, symbol: string, currency: string) => {
    try {
        if (symbol === '%') {
            return (amount / 100).toLocaleString(undefined, {
                style: 'percent',
                maximumFractionDigits: 2
            })
        }

        return amount.toLocaleString('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        })

    } catch (error) {
        return `${symbol}${amount}`
    }
}

export default formatCashback