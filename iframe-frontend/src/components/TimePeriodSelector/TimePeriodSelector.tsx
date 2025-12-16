import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import styles from './styles.module.css';
import parseTime from '../../utils/parseTime';
import { useRouteLoaderData } from 'react-router-dom';

// Define the possible time periods as a type
export type TimePeriod = '24 hours' | '7 days' | '30 days' | 'Forever';

const HOUR_MS = 60 * 60 * 1000;
// Define timestamp values in milliseconds for each period (except Forever)
// eslint-disable-next-line react-refresh/only-export-components
export const TIME_PERIODS: Record<Exclude<TimePeriod, 'Forever'>, number> = {
    '24 hours': 24 * HOUR_MS,
    '7 days': 7 * 24 * HOUR_MS,
    '30 days': 30 * 24 * HOUR_MS,
};

interface TimePeriodSelectorProps {
    defaultPeriod?: TimePeriod | null;
    onChange: (period: TimePeriod | null, timestamp: number | null) => void;
    periods?: TimePeriod[];
    className?: string;
}

const TimePeriodSelector: React.FC<TimePeriodSelectorProps> = ({
    defaultPeriod = null,
    onChange,
    periods = ['24 hours', '7 days', '30 days', 'Forever'],
    className = '',
}) => {
    const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod | null>(defaultPeriod);
    const { version } = useRouteLoaderData('root') as LoaderData;
    const handleSelect = useCallback(
        (period: TimePeriod) => {
            // If clicking the already selected period, deselect it
            const newSelection = selectedPeriod === period ? null : period;
            setSelectedPeriod(newSelection);

            if (newSelection === null) {
                // Return null for both period and timestamp when deselected
                onChange(null, null);
                return;
            }

            // Calculate the timestamp for the selected period (if not 'Forever')
            const timestamp = newSelection !== 'Forever'
                ? parseTime(TIME_PERIODS[newSelection], version)
                : 999999999999999; // Arbitrary large number for 'Forever'
            onChange(newSelection, timestamp);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [onChange, selectedPeriod]
    );

    return (
        <div
            id="time-period-selector"
            className={`${styles.container} ${className}`}
            role="radiogroup"
            aria-label="Time period selection"
        >
            {periods.map((period) => {
                const isSelected = selectedPeriod === period;
                return (
                    <motion.button
                        key={period}
                        role="radio"
                        aria-checked={isSelected}
                        className={` ${isSelected ? styles.selected : ''} ${styles.button}`}
                        onClick={() => handleSelect(period)}
                        whileTap={{ scale: 0.95 }}
                        layout
                        transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30
                        }}
                    >
                        {period}
                    </motion.button>
                );
            })}
        </div>
    );
};

export default TimePeriodSelector;