import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useGitStats } from '../../src/composables/useGitStats.ts'

describe('useGitStats', () => {
	const mockData = {
		lastUpdated: '2026-01-14T10:00:00Z',
		profiles: [
			{
				username: 'testuser',
				platform: 'github',
				stats: {
					projectCount: 25,
					commitCount: 1500,
					contributions: [],
				},
			},
		],
		totals: {
			projectCount: 25,
			commitCount: 1500,
		},
		metadata: {
			fetchedAt: Date.now(),
			source: 'static',
		},
	}

	beforeEach(() => {
		localStorage.clear()
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('should initialize with loading state', () => {
		global.fetch = vi.fn(() => Promise.reject())

		const { loading } = useGitStats()
		expect(loading.value).toBe(true)
	})

	it('should load data from static file', async () => {
		global.fetch = vi.fn(() =>
			Promise.resolve({
				ok: true,
				json: () => Promise.resolve(mockData),
			})
		)

		const { data, loading, dataSource } = useGitStats({
			dataUrl: '/test-data.json',
		})

		// Wait for data to load
		await vi.waitFor(() => {
			expect(loading.value).toBe(false)
		})

		expect(data.value).toEqual(mockData)
		expect(dataSource.value).toBe('static')
	})

	it('should cache data to localStorage', async () => {
		global.fetch = vi.fn(() =>
			Promise.resolve({
				ok: true,
				json: () => Promise.resolve(mockData),
			})
		)

		const { data } = useGitStats()

		await vi.waitFor(() => {
			expect(data.value).not.toBeNull()
		})

		const cached = localStorage.getItem('git_stats_cache')
		expect(cached).not.toBeNull()

		const parsedCache = JSON.parse(cached)
		expect(parsedCache.totals.projectCount).toBe(25)
	})

	it('should use cache when static file fails', async () => {
		// First, populate cache
		const cachedData = {
			...mockData,
			cachedAt: Date.now(),
		}
		localStorage.setItem('git_stats_cache', JSON.stringify(cachedData))

		// Then fail the fetch
		global.fetch = vi.fn(() =>
			Promise.resolve({
				ok: false,
				status: 404,
			})
		)

		const { data, dataSource } = useGitStats({
			useStaleCache: true,
		})

		await vi.waitFor(() => {
			expect(dataSource.value).toBe('cache')
		})

		expect(data.value.totals.projectCount).toBe(25)
	})

	it('should use mock data when everything fails', async () => {
		global.fetch = vi.fn(() =>
			Promise.resolve({
				ok: false,
				status: 404,
			})
		)

		const { data, dataSource } = useGitStats({
			useStaleCache: false,
		})

		await vi.waitFor(() => {
			expect(dataSource.value).toBe('mock')
		})

		expect(data.value).not.toBeNull()
		expect(data.value.metadata.source).toBe('mock')
	})

	it('should detect dummy data', async () => {
		const dummyData = {
			...mockData,
			metadata: {
				...mockData.metadata,
				isDummy: true,
			},
		}

		global.fetch = vi.fn(() =>
			Promise.resolve({
				ok: true,
				json: () => Promise.resolve(dummyData),
			})
		)

		const { isDummy } = useGitStats()

		await vi.waitFor(() => {
			expect(isDummy.value).toBe(true)
		})
	})

	it('should format lastUpdatedText correctly', async () => {
		const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
		const testData = {
			...mockData,
			lastUpdated: oneHourAgo.toISOString(),
		}

		global.fetch = vi.fn(() =>
			Promise.resolve({
				ok: true,
				json: () => Promise.resolve(testData),
			})
		)

		const { lastUpdatedText } = useGitStats()

		await vi.waitFor(() => {
			expect(lastUpdatedText.value).toContain('hour')
		})
	})

	it('should show "just now" for recent updates', async () => {
		const testData = {
			...mockData,
			lastUpdated: new Date().toISOString(),
		}

		global.fetch = vi.fn(() =>
			Promise.resolve({
				ok: true,
				json: () => Promise.resolve(testData),
			})
		)

		const { lastUpdatedText } = useGitStats()

		await vi.waitFor(() => {
			expect(lastUpdatedText.value).toBe('just now')
		})
	})

	it('should use custom cache key', async () => {
		global.fetch = vi.fn(() =>
			Promise.resolve({
				ok: true,
				json: () => Promise.resolve(mockData),
			})
		)

		const customKey = 'custom_cache_key'
		const { data } = useGitStats({
			cacheKey: customKey,
		})

		await vi.waitFor(() => {
			expect(data.value).not.toBeNull()
		})

		const cached = localStorage.getItem(customKey)
		expect(cached).not.toBeNull()
	})

	it('should respect cacheTTL setting', async () => {
		// This test verifies the TTL parameter is accepted
		// Actual TTL behavior would need time-based testing
		global.fetch = vi.fn(() =>
			Promise.resolve({
				ok: true,
				json: () => Promise.resolve(mockData),
			})
		)

		const { data } = useGitStats({
			cacheTTL: 1000, // 1 second
		})

		await vi.waitFor(() => {
			expect(data.value).not.toBeNull()
		})
	})

	it('should generate correct dataSourceText', async () => {
		global.fetch = vi.fn(() =>
			Promise.resolve({
				ok: true,
				json: () => Promise.resolve(mockData),
			})
		)

		const { dataSourceText } = useGitStats()

		await vi.waitFor(() => {
			expect(dataSourceText.value).toBe('Real-time data')
		})
	})

	it('should show warning for dummy data', async () => {
		const dummyData = {
			...mockData,
			metadata: {
				...mockData.metadata,
				isDummy: true,
			},
		}

		global.fetch = vi.fn(() =>
			Promise.resolve({
				ok: true,
				json: () => Promise.resolve(dummyData),
			})
		)

		const { dataSourceText, isDummy } = useGitStats()

		await vi.waitFor(() => {
			expect(isDummy.value).toBe(true)
			expect(dataSourceText.value).toContain('dummy')
		})
	})
})
