// AB-test assignments come from the backend (embedded in the /verify token) as
// [{ testName, variant }]. The client only reads them — no bucketing here. Look
// up by test name; returns undefined when the user is in no such test.
export const variantOf = (testVariants: TestVariant[], testName: string): string | undefined =>
    testVariants.find(t => t.testName === testName)?.variant
