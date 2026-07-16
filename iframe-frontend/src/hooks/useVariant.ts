import { useRouteLoaderData } from "react-router-dom"
import { variantOf } from "../utils/ABTest/testVariants"

/**
 * Returns the variant this user is assigned for the given test, or 'control' if
 * they aren't in it. Keyed by test name — never by position — so several tests
 * on the same surface stay independent. Assignments are computed on the backend
 * and delivered via the /verify token (loader data `testVariants`).
 */
export const useVariant = (testName: string): string => {
    const { testVariants } = useRouteLoaderData('root') as LoaderData
    return variantOf(testVariants, testName)
}
