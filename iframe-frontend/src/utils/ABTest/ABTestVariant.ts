import { TEST_ID } from "../../config";
import murmurhash from "./murmurhash"

export const variants = {
    'control': 50,
    'test': 50
} as const

export type VariantKey = keyof typeof variants;

export const selectVariant = (userId: string): VariantKey => {

    // Hash userId to create a deterministic "random" number
    const hash = Math.abs(murmurhash(`${TEST_ID}-${userId}`)) % 100; // get a number between 0-99

    // Calculate cumulative distribution weights
    const cumulativeDistribution: { variant: VariantKey; weight: number }[] = [];
    let cumulativeWeight = 0;

    const keys = Object.keys(variants) as VariantKey[];

    for (const variant of keys) {
        const weight = variants[variant] ? variants[variant] || 0 : 100 / keys.length;
        cumulativeWeight += weight;
        cumulativeDistribution.push({ variant, weight: cumulativeWeight });
    }

    // Use the hashed value to select a variant based on cumulative weights
    for (const { variant, weight } of cumulativeDistribution) {
        if (hash < weight) {
            return variant;
        }
    }
    // Fallback in case of rounding errors
    return keys[keys.length - 1];
};