import { describe, it, expect, vi, beforeEach } from 'vitest'

const store: Record<string, any> = {}
vi.mock('../utils/storage/storage', () => ({
    default: {
        get: vi.fn(async (key: string) => store[key]),
        set: vi.fn(async (key: string, value: any) => { store[key] = value }),
        remove: vi.fn(async (key: string) => { delete store[key] }),
    }
}))
vi.mock('../utils/api/checkEvents', () => ({ default: vi.fn() }))
vi.mock('../utils/background/getWalletAddress', () => ({ default: vi.fn(async () => 'addr') }))
vi.mock('../utils/background/checkNotifications', async (importOriginal) => {
    const mod: any = await importOriginal()
    return { default: vi.fn(mod.default) }
})
vi.mock('../utils/background/activate', () => ({ default: vi.fn() }))
vi.mock('../utils/background/addQuietDomain', () => ({ default: vi.fn() }))
vi.mock('../utils/background/openExtensionCashbackPage', () => ({ openExtensionCashbackPage: vi.fn() }))
vi.mock('../utils/background/optOut', () => ({ getOptOut: vi.fn(), setOptOut: vi.fn() }))
vi.mock('../utils/background/followups', () => ({ armFollowups: vi.fn() }))
vi.mock('../utils/logger', () => ({ logger: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() } }))

import storage from '../utils/storage/storage'
import checkEvents from '../utils/api/checkEvents'
import checkNotifications from '../utils/background/checkNotifications'
import handleContentMessages from '../utils/background/handleContentMessages'

const walletUpdate = (listener: Function, walletAddress: string) =>
    new Promise(resolve => listener({ from: 'bringweb3', action: 'WALLET_ADDRESS_UPDATE', walletAddress }, { tab: { id: 1 } }, resolve))

beforeEach(() => {
    for (const k of Object.keys(store)) delete store[k]
    vi.clearAllMocks()
    vi.mocked(checkEvents).mockResolvedValue({ showNotification: false, token: '', iframeUrl: '', nextCall: 86400000, expiration: 0 })
})

describe('checkNotifications', () => {
    it('backs off for an hour when the response has no nextCall', async () => {
        vi.mocked(checkEvents).mockResolvedValue({ status: 400, message: 'missing cashbackUrl' })
        const before = Date.now()
        await checkNotifications(true, undefined, undefined, true)
        const [start, end] = store.notificationCheck
        expect(start).toBeGreaterThanOrEqual(before)
        expect(end - start).toBe(60 * 60 * 1000)
    })

    it('backs off for an hour when the request throws (network / non-JSON reply)', async () => {
        vi.mocked(checkEvents).mockRejectedValue(new Error('WAF block page'))
        const res = await checkNotifications(true, undefined, undefined, true)
        expect(res.showNotification).toBe(false)
        const [start, end] = store.notificationCheck
        expect(end - start).toBe(60 * 60 * 1000)
    })
})

describe('WALLET_ADDRESS_UPDATE', () => {
    it('only checks notifications when the address actually changed', async () => {
        let listener: Function = () => { }
        ;(globalThis as any).chrome = { runtime: { onMessage: { addListener: (fn: Function) => { listener = fn } } } }
        handleContentMessages(undefined, true)

        await walletUpdate(listener, 'A')
        await walletUpdate(listener, 'A')
        await walletUpdate(listener, 'A')
        expect(checkNotifications).toHaveBeenCalledTimes(1)
        expect(vi.mocked(storage.set).mock.calls.filter(([key]) => key === 'walletAddress')).toHaveLength(1)

        await walletUpdate(listener, 'B')
        expect(checkNotifications).toHaveBeenCalledTimes(2)
        expect(store.walletAddress).toBe('B')
    })

    it('still checks when navigation already stored the new address', async () => {
        let listener: Function = () => { }
        ;(globalThis as any).chrome = { runtime: { onMessage: { addListener: (fn: Function) => { listener = fn } } } }
        handleContentMessages(undefined, true)
        // Account switch: getWalletAddress wrote the new address during navigation,
        // but the last notification check ran for the old one.
        store.walletAddress = 'B'
        store.lastCheckedWalletAddress = 'A'

        await walletUpdate(listener, 'B')
        expect(checkNotifications).toHaveBeenCalledTimes(1)
        expect(store.lastCheckedWalletAddress).toBe('B')
    })

    it('still responds when the notification check fails', async () => {
        let listener: Function = () => { }
        ;(globalThis as any).chrome = { runtime: { onMessage: { addListener: (fn: Function) => { listener = fn } } } }
        handleContentMessages(undefined, true)
        vi.mocked(checkEvents).mockRejectedValue(new Error('403'))

        await expect(walletUpdate(listener, 'C')).resolves.toBe('C')
        expect(store.walletAddress).toBe('C')
    })
})
