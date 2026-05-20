import { useRef } from "react"
import { useRouteLoaderData } from "react-router-dom"
import { useWalletAddress } from "./useWalletAddress"

/**
 * Returns the precomputed activation payload from loader data, but only while
 * the current wallet address still matches the wallet the payload was computed
 * for. If the wallet changes during the iframe's lifetime, the payload is
 * considered stale and `null` is returned, forcing a standAloneActivation.
 *
 * The userId pairing is enforced server-side at /verify (the JWT carries the
 * userId it was minted for; the server omits activationPayload on mismatch),
 * so it does not need to be re-checked here.
 */
export const useActivationPayload = () => {
    const { activationPayload, walletAddress: payloadWalletAddress } = useRouteLoaderData('root') as LoaderData
    const { walletAddress } = useWalletAddress()
    const payloadWalletRef = useRef(payloadWalletAddress)

    if (walletAddress !== payloadWalletRef.current) return null
    return activationPayload ?? null
}
