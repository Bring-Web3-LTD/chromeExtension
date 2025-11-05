import styles from './styles.module.css'

interface props {
    options: string[]
    select: string
    set: (select: string) => void
}

const CryptoSymbolSelect = ({ options, select, set }: props): JSX.Element => {

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        set(e.target.value)
    }

    if (options.length === 1) {
        return (
            <span id="cashback-symbol" className={styles.cashback_symbol}>{options[0]}</span>
        )
    }

    return (
        <select
            id="crypto-symbol-select"
            className={styles.select}
            onChange={handleChange}
        >
            {options.map(option => (
                <option
                    key={option}
                    value={option}
                    selected={option === select}
                >
                    {option}
                </option>
            ))}
        </select>
    )
}

export default CryptoSymbolSelect