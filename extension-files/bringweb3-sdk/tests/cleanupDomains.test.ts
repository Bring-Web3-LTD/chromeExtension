import { cleanupQuietDomains } from '../utils/background/cleanupDomains'
import { describe, it, expect } from 'vitest'

const entry = (domain: string, start: number, end: number) => ({
    domain,
    time: [start, end] as [number, number],
    phase: 'quiet' as const
})

describe('cleanupQuietDomains', () => {
    it('keeps a forever entry (no 60-day cap)', () => {
        const now = Date.now()
        const forever = entry('forever.com', now, now + 999999999999999)
        expect(cleanupQuietDomains([forever])).toEqual([forever])
    })

    it('drops naturally expired entries', () => {
        const now = Date.now()
        const expired = entry('expired.com', now - 2000, now - 1000)
        const active = entry('active.com', now, now + 1000)
        expect(cleanupQuietDomains([expired, active])).toEqual([active])
    })
})
