import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../utils/logger', () => ({ logger: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() } }))
vi.mock('../utils/contentScript/injectIFrame', () => ({ getInjectedIframeOrigin: vi.fn(() => 'https://popup.bringweb3.io') }))
vi.mock('../utils/contentScript/applyStyles', () => ({ default: vi.fn() }))
vi.mock('../utils/contentScript/addKeyFrames', () => ({ default: vi.fn() }))
vi.mock('../utils/contentScript/cleanupManager', () => ({ contentScriptCleanup: { add: vi.fn(), cleanup: vi.fn() } }))

import { isAllowedOrigin } from '../utils/originAllowlist'
import { getInjectedIframeOrigin } from '../utils/contentScript/injectIFrame'
import handleIframeMessages from '../utils/contentScript/handleIframeMessages'

const PARTNER = 'partner.com'

describe('isAllowedOrigin', () => {
    it('matches the domain and its subdomains', () => {
        expect(isAllowedOrigin('https://partner.com', [PARTNER])).toBe(true)
        expect(isAllowedOrigin('https://rewards.partner.com', [PARTNER])).toBe(true)
    })

    it('normalizes both sides, so www never decides the outcome', () => {
        expect(isAllowedOrigin('https://www.partner.com', [PARTNER])).toBe(true)
        expect(isAllowedOrigin('https://partner.com', ['www.partner.com'])).toBe(true)
    })

    it('rejects lookalikes and non-https origins', () => {
        expect(isAllowedOrigin('https://evil-partner.com', [PARTNER])).toBe(false)
        expect(isAllowedOrigin('https://rewards.partner.com.evil.com', [PARTNER])).toBe(false)
        expect(isAllowedOrigin('http://partner.com', [PARTNER])).toBe(false)
        expect(isAllowedOrigin('not-an-origin', [PARTNER])).toBe(false)
    })

    it('allows nothing when the list is empty - bringweb3.io included', () => {
        expect(isAllowedOrigin('https://portal.bringweb3.io', [])).toBe(false)
        expect(isAllowedOrigin('https://portal.bringweb3.io', ['bringweb3.io'])).toBe(true)
    })
})

describe('handleIframeMessages origin check', () => {
    const sendMessage = vi.fn()

    const activate = (origin: string, originAllowlist: string[] = []) => handleIframeMessages({
        event: { origin, data: { from: 'bringweb3', action: 'ACTIVATE', extensionId: 'other-extension', domain: 'a.com' } } as BringEvent,
        iframeEl: null,
        promptLogin: async () => { },
        originAllowlist
    })

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(getInjectedIframeOrigin).mockReturnValue('https://popup.bringweb3.io')
            ; (globalThis as any).chrome = { runtime: { id: 'my-extension', sendMessage } }
    })

    it('forwards an ACTIVATE from the injected iframe origin', () => {
        activate('https://popup.bringweb3.io')
        expect(sendMessage).toHaveBeenCalledTimes(1)
    })

    it('forwards an ACTIVATE from an allowlisted domain', () => {
        activate('https://rewards.partner.com', [PARTNER])
        expect(sendMessage).toHaveBeenCalledTimes(1)
    })

    it('drops an ACTIVATE from a foreign origin', () => {
        activate('https://evil.com', [PARTNER])
        expect(sendMessage).not.toHaveBeenCalled()
    })

    it('drops an ACTIVATE from a page that self-hosts on a lookalike origin', () => {
        vi.mocked(getInjectedIframeOrigin).mockReturnValue(null)
        activate('https://evil-partner.com', [PARTNER])
        expect(sendMessage).not.toHaveBeenCalled()
    })

    it('drops an ACTIVATE from a bringweb3.io frame when the list is empty', () => {
        vi.mocked(getInjectedIframeOrigin).mockReturnValue(null)
        activate('https://portal.bringweb3.io', [])
        expect(sendMessage).not.toHaveBeenCalled()
    })
})
