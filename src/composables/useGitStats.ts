import { ref, computed } from 'vue'
import type {
	GitStatsData,
	GitStatsConfig,
	UseGitStatsReturn,
	ContributionWeek,
} from '../types'

/**
 * Composable for loading and caching git stats data
 * @param config - Configuration object
 */
export function useGitStats(config: GitStatsConfig = {}): UseGitStatsReturn {
	const {
		dataUrl = '/data/git-stats.json',
		// TODO: is this required?
		// cacheTTL = 24 * 60 * 60 * 1000, // 24 hours
		useStaleCache = true,
		cacheKey = 'git_stats_cache',
	} = config

	const loading = ref(false)
	const error = ref<Error | null>(null)
	const data = ref<GitStatsData | null>(null)
	const dataSource = ref<'static' | 'cache' | 'mock' | 'dummy' | null>(null)
	const isDummy = ref(false)

	/**
	 * Load data with fallback strategy:
	 * 1. Try static file
	 * 2. Try browser cache
	 * 3. Use mock data
	 */
	async function loadData(): Promise<GitStatsData | null> {
		loading.value = true
		error.value = null

		try {
			// Try loading from static file first
			const staticData = await loadFromStaticFile()
			if (staticData) {
				dataSource.value = 'static'
				isDummy.value = staticData.metadata?.isDummy === true
				data.value = staticData
				cacheData(staticData)
				return staticData
			}
		} catch (err) {
			console.warn('Failed to load from static file:', err)
			error.value =
				err instanceof Error ? err : new Error('Failed to load data')
		}

		// Fallback to cached data
		if (useStaleCache) {
			try {
				const cachedData = loadFromCache()
				if (cachedData) {
					dataSource.value = 'cache'
					data.value = cachedData
					return cachedData
				}
			} catch (err) {
				console.warn('Failed to load from cache:', err)
			}
		}

		// Final fallback to mock data
		console.warn('Using mock git stats data')
		dataSource.value = 'mock'
		const mockData = generateMockData()
		data.value = mockData
		return mockData
	}

	/**
	 * Load data from static JSON file
	 */
	async function loadFromStaticFile(): Promise<GitStatsData | null> {
		const response = await fetch(dataUrl)
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`)
		}
		return await response.json()
	}

	/**
	 * Load data from localStorage cache
	 */
	function loadFromCache(): GitStatsData | null {
		const cached = localStorage.getItem(cacheKey)
		if (!cached) return null

		const parsedCache: GitStatsData = JSON.parse(cached)
		return parsedCache
	}

	/**
	 * Save data to localStorage cache
	 */
	function cacheData(dataToCache: GitStatsData): void {
		try {
			const cacheData: GitStatsData = {
				...dataToCache,
				cachedAt: Date.now(),
			}
			localStorage.setItem(cacheKey, JSON.stringify(cacheData))
		} catch (err) {
			console.warn('Failed to cache data:', err)
		}
	}

	/**
	 * Generate mock data for development/fallback
	 */
	function generateMockData(): GitStatsData {
		return {
			lastUpdated: new Date().toISOString(),
			profiles: [
				{
					username: 'mockuser',
					platform: 'github',
					stats: {
						projectCount: 30,
						commitCount: 2500,
						contributions: generateMockContributions(),
					},
				},
			],
			totals: {
				projectCount: 30,
				commitCount: 2500,
			},
			metadata: {
				source: 'mock',
				fetchedAt: Date.now(),
			},
		}
	}

	/**
	 * Generate mock contribution data (53 weeks)
	 */
	function generateMockContributions(): ContributionWeek[] {
		const weeks: ContributionWeek[] = []
		const now = new Date()
		const endDate = new Date(now)
		endDate.setDate(endDate.getDate() - endDate.getDay())

		const startDate = new Date(endDate)
		startDate.setDate(startDate.getDate() - 52 * 7)

		const currentDate = new Date(startDate)

		for (let week = 0; week < 53; week++) {
			const weekData: ContributionWeek = {
				firstDay: new Date(currentDate).toISOString().split('T')[0],
				contributionDays: [],
			}

			for (let day = 0; day < 7; day++) {
				const isInFuture = currentDate > now
				const dayCount = isInFuture ? 0 : Math.floor(Math.random() * 15)

				weekData.contributionDays.push({
					date: new Date(currentDate).toISOString().split('T')[0],
					contributionCount: dayCount,
					weekday: day,
				})
				currentDate.setDate(currentDate.getDate() + 1)
			}

			weeks.push(weekData)
		}

		return weeks
	}

	/**
	 * Format "last updated" text
	 */
	const lastUpdatedText = computed(() => {
		if (!data.value?.lastUpdated) return ''

		const date = new Date(data.value.lastUpdated)
		const now = new Date()
		const diffHours = Math.floor(
			(now.getTime() - date.getTime()) / (1000 * 60 * 60)
		)

		if (diffHours < 1) return 'just now'
		if (diffHours < 24) return `${diffHours} hours ago`

		const diffDays = Math.floor(diffHours / 24)
		if (diffDays === 1) return 'yesterday'
		if (diffDays < 7) return `${diffDays} days ago`

		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year:
				date.getFullYear() !== now.getFullYear()
					? 'numeric'
					: undefined,
		})
	})

	/**
	 * Computed data source display text
	 */
	const dataSourceText = computed(() => {
		if (isDummy.value) {
			return '⚠️ Using dummy data for testing'
		}

		switch (dataSource.value) {
			case 'static':
				return 'Real-time data'
			case 'cache':
				return 'Cached data'
			case 'mock':
				return 'Sample data'
			default:
				return ''
		}
	})

	// Auto-load on creation
	loadData().finally(() => {
		loading.value = false
	})

	return {
		data,
		loading,
		error,
		dataSource,
		dataSourceText,
		lastUpdatedText,
		isDummy,
		loadData,
		cacheData,
	}
}
