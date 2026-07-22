import { useRouteLoaderData } from "react-router-dom"
import { variantOf } from "../utils/ABTest/testVariants"

/**
 * Returns the variant this user is assigned for the given test,
 * or undefined if they aren't in it.
 */
export const useVariant = (testName: string): string | undefined => {
    const { testVariants } = useRouteLoaderData('root') as LoaderData
    return variantOf(testVariants, testName)
}
