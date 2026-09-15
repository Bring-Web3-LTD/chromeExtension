import { describe, it, expect, vi, beforeEach } from 'vitest'

const store: Record<string, any> = {}
vi.mock('../utils/storage/storage', () => ({
    default: {
        get: vi.fn(async (key: string) => store[key]),
        set: vi.fn(async (key: string, value: any) => { store[key] = value }),
        remove: vi.fn(async (key: string) => { delete store[key] }),
    }
}))
vi.mock('../utils/background/getUserId', () => ({ default: vi.fn(async () => 'user-1') }))
vi.mock('../utils/getVersion', () => ({ default: vi.fn(() => '1.9.0') }))

import { ApiEndpoint } from '../utils/apiEndpoint'
import apiRequest from '../utils/api/apiRequest'

const fetchMock = vi.fn(async () => ({ json: async () => ({ ok: true }) }) as any)

const requestedUrl = () => (fetchMock.mock.calls as any[])[0]?.[0] as string

beforeEach(() => {
    for (const k of Object.keys(store)) delete store[k]
    vi.clearAllMocks()
    globalThis.fetch = fetchMock as any
    const instance = ApiEndpoint.getInstance() as any
    instance.baseUrl = ''
    instance.setEnvName('')
    instance.setApiKey('test-key')
})

describe('setBaseUrl', () => {
    const setBaseUrl = (url: string) => {
        ApiEndpoint.getInstance().setBaseUrl(url)
        return (ApiEndpoint.getInstance() as any).baseUrl
    }

    it('stores the URL as given', () => {
        expect(setBaseUrl('https://api.partner.com/bring/')).toBe('https://api.partner.com/bring/')
    })

    it('accepts any scheme the partner configures', () => {
        expect(setBaseUrl('http://localhost:3000/bring')).toBe('http://localhost:3000/bring')
        expect(setBaseUrl('http://api.partner.com/bring')).toBe('http://api.partner.com/bring')
    })

    it('throws on a value that is not a URL', () => {
        expect(() => setBaseUrl('api.partner.com/bring')).toThrow('invalid baseUrl')
    })
})

describe('apiRequest endpoint building', () => {
    it('requests baseUrl itself when set - no path appended', async () => {
        ApiEndpoint.getInstance().setBaseUrl('https://api.partner.com/bring')
        await apiRequest({ path: '/check/popup', method: 'POST', params: { domain: 'a.com' } })
        expect(requestedUrl()).toBe('https://api.partner.com/bring')
    })

    it('lets a dev envName win over baseUrl', async () => {
        ApiEndpoint.getInstance().setEnvName('dev')
        ApiEndpoint.getInstance().setBaseUrl('https://api.partner.com/bring')
        await apiRequest({ path: '/check/popup', method: 'POST', params: { domain: 'a.com' } })
        expect(requestedUrl()).toBe('https://api.bringweb3.io/dev/v1/extension/check/popup')
    })

    it('appends only the query string on a GET', async () => {
        ApiEndpoint.getInstance().setBaseUrl('https://api.partner.com/bring')
        await apiRequest({ path: '/domains', method: 'GET', params: { trigger: 'x' } })
        expect(requestedUrl().startsWith('https://api.partner.com/bring?')).toBe(true)
    })

    it('keeps the Bring layout when baseUrl is unset', async () => {
        await apiRequest({ path: '/check/popup', method: 'POST', params: { domain: 'a.com' } })
        expect(requestedUrl()).toBe('https://api.bringweb3.io/v1/extension/check/popup')
    })
})
