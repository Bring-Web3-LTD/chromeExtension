import { TEST_ID } from "../../config";
import murmurhash from "./murmurhash";

// Define company/organization types
export type PlatformName = string;

// Define variant configurations per company
export type VariantDistribution = {
  [variant: string]: number;
};

export type VariantsConfig = {
  [platformName: string]: VariantDistribution;
};

// Example configuration
export const variants = {
  // Global default for companies without specific settings
  'default': {
    'control': 50,
    'test': 50
  },
  // Company-specific configurations
  'argent': {
    'argentControl': 100,
    'test': 0
  }
};

export type VariantKey =
  keyof typeof variants['default'] |
  keyof typeof variants['argent']

// Get the variant distribution for a given company
export const getVariantDistribution = (platformName: PlatformName): VariantDistribution => {
  return variants[platformName as keyof typeof variants] || variants.default;
};

// Select a variant for a specific user at a specific company
export const selectVariant = (userId: string, platformName: PlatformName = 'default'): VariantKey => {
  platformName = platformName.toLowerCase();
  const variantDistribution = getVariantDistribution(platformName);

  // Check for company-wide overrides
  const companyOverride = checkCompanyOverride(platformName);
  if (companyOverride) {
    return companyOverride;
  }

  // Hash userId with company and test ID to create a deterministic "random" number
  const hash = Math.abs(murmurhash(`${TEST_ID}-${platformName}-${userId}`)) % 100; // get a number between 0-99

  // Calculate cumulative distribution weights
  const cumulativeDistribution: { variant: VariantKey; weight: number }[] = [];
  let cumulativeWeight = 0;

  const variants = Object.keys(variantDistribution) as VariantKey[];

  for (const variant of variants) {
    const weight = variantDistribution[variant] || 100 / variants.length;
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
  return variants[variants.length - 1];
};

// Check if the company has a forced override
// This could come from a remote config or contract requirements
const checkCompanyOverride = (platformName: PlatformName): VariantKey | null => {
  // Example: Check if this company is on a special contract that requires a specific experience
  // Or check if there's an emergency override in place

  // Hypothetical example: Company E is on a special contract
  // if (platformName === 'company_e') {
  //   return 'enterprise';
  // }
  if (!platformName) {
    return null; // No override
  }
  return null; // No override by default
};

// For nested experiments: Run a sub-experiment within a variant
export const selectNestedVariant = (userId: string, platformName: PlatformName, parentVariant: string): string => {
  // Create a new hash seed that incorporates the parent variant
  const nestedTestId = `${TEST_ID}-${parentVariant}`;
  const hash = Math.abs(murmurhash(`${nestedTestId}-${platformName}-${userId}`)) % 100;

  // Define sub-variants for the parent variant (could be stored in configuration)
  // This could also be dynamic based on company
  const subVariants = {
    'sub_control': 50,
    'sub_test': 50
  };

  // Define the type to avoid TypeScript errors
  type SubVariantKey = keyof typeof subVariants;

  // Similar logic to select from sub-variants
  const variants = Object.keys(subVariants) as SubVariantKey[];
  let cumulativeWeight = 0;

  for (const variant of variants) {
    cumulativeWeight += subVariants[variant];
    if (hash < cumulativeWeight) {
      return variant;
    }
  }

  return variants[variants.length - 1];
};

// Example: Function to create company-specific feature flag checks
export const hasFeature = (userId: string, platformName: PlatformName, featureName: string): boolean => {
  const variant = selectVariant(userId, platformName);

  // Map variants to feature flags
  const featureFlagMap: Record<string, string[]> = {
    'control': ['basic_dashboard', 'export_data'],
    'test': ['basic_dashboard', 'export_data', 'advanced_analytics'],
    'premium': ['basic_dashboard', 'export_data', 'advanced_analytics', 'white_labeling', 'api_access'],
    'enterprise': ['basic_dashboard', 'export_data', 'advanced_analytics', 'white_labeling', 'api_access', 'sla_support']
  };

  const enabledFeatures = featureFlagMap[variant] || [];
  return enabledFeatures.includes(featureName);
};

// Usage examples:
// 
// // Get variant for a user at Company A
// const userVariant = selectVariant('user123', 'company_a');
// 
// // Check if a user has access to a specific feature
// const canAccessAnalytics = hasFeature('user123', 'company_b', 'advanced_analytics');
// 
// // Nested experiment example
// const mainVariant = selectVariant('user123', 'company_c');
// if (mainVariant === 'premium') {
//   const subVariant = selectNestedVariant('user123', 'company_c', 'premium');
//   // Use subVariant for more granular feature testing within the premium experience
// }
