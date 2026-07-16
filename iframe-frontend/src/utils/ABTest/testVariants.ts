// AB-test assignments come from the backend (embedded in the /verify token).
// The client only reads them — no bucketing here. Look up by test name; a test
// the user isn't in falls back to 'control'.
export type TestVariants = Record<string, string>

export const variantOf = (testVariants: TestVariants, testName: string): string =>
    testVariants[testName] ?? 'control'
