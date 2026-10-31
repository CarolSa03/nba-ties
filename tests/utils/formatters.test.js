import { describe, it, expect, vi, afterEach } from 'vitest'
import { formatDate, extractPeriodScore, timeAgo } from './formatters'

describe('formatDate', () => {
  it('formats a plain date', () => {
    expect(formatDate('2025-01-02')).toBe('Thu, Jan 2, 2025')
  })
  it('does not shift the day for dates at midnight', () => {
    expect(formatDate('2025-03-01')).toContain('Mar 1')
  })
})

describe('extractPeriodScore', () => {
  it('returns the score inside the brackets', () => {
    expect(extractPeriodScore('53-55 (28-30)')).toBe('28-30')
  })
  it('returns a bare score as is', () => {
    expect(extractPeriodScore('28-30')).toBe('28-30')
  })
  it('falls back to 0-0 for empty or odd values', () => {
    expect(extractPeriodScore('')).toBe('0-0')
    expect(extractPeriodScore(null)).toBe('0-0')
    expect(extractPeriodScore('n/a')).toBe('0-0')
  })
})

describe('timeAgo', () => {
  afterEach(() => vi.useRealTimers())
  it('describes minutes, hours and days', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-10T12:00:00'))
    const ago = (ms) => timeAgo(Date.now() - ms)
    expect(ago(10 * 1000)).toBe('just now')
    expect(ago(5 * 60000)).toBe('5 min ago')
    expect(ago(3 * 3600000)).toBe('3 h ago')
    expect(ago(2 * 86400000)).toBe('2 days ago')
  })
})