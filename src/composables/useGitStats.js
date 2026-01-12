import { ref, computed } from 'vue'

/**
 * Composable for loading and caching git stats data
 * @param {Object} config - Configuration object
 * @param {string} config.dataUrl - URL to the stats JSON file
 * @param {number} config.cacheTTL - Cache time-to-live in milliseconds
 * @param {boolean} config.useStaleCache - Whether to use stale cache as fallback
 */
export function useGitStats(config = {}) {
	const {
		dataUrl = '/data/git-stats.json',
		cacheTTL = 24 * 60 * 60 * 1000, // 24 hours
		useStaleCache = true,
		cacheKey = 'git_stats_cache'
	} = config

	const loading = ref(false)
	const error = ref(null)
	const data = ref(null)
	const dataSource = ref(null) // 'static', 'cache', or 'mock'

	/**
	 * Load data with fallback strategy:
	 * 1. Try static file
	 * 2. Try browser cache
	 * 3. Use mock data
	 */
	async function loadData() {
		loading.value = true
		error.value = null

		try {
			// Try loading from static file first
			const staticData = await loadFromStaticFile()
			if (staticData) {
				dataSource.value = 'static'
				data.value = staticData
				cacheData(staticData)
				return staticData
			}
		} catch (err) {
			console.warn('Failed to load from static file:', err)
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
	async function loadFromStaticFile() {
		const response = await fetch(dataUrl)
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`)
		}
		return await response.json()
	}

	/**
	 * Load data from localStorage cache
	 */
	function loadFromCache() {
		const cached = localStorage.getItem(cacheKey)
		if (!cached) return null

		const parsedCache = JSON.parse(cached)
		const cacheAge = Date.now() - (parsedCache.cachedAt || 0)

		// Return cached data even if stale (better than nothing)
		return parsedCache
	}

	/**
	 * Save data to localStorage cache
	 */
	function cacheData(data) {
		try {
			const cacheData = {
				...data,
				cachedAt: Date.now()
			}
			localStorage.setItem(cacheKey, JSON.stringify(cacheData))
		} catch (err) {
			console.warn('Failed to cache data:', err)
		}
	}

	/**
	 * Generate mock data for development/fallback
	 */
	function generateMockData() {
		return {
			lastUpdated: new Date().toISOString(),
			profiles: [
				{
					username: 'mockuser',
					platform: 'github',
					stats: {
						projectCount: 30,
						commitCount: 2500,
						contributions: generateMockContributions()
					}
				}
			],
			totals: {
				projectCount: 30,
				commitCount: 2500
			},
			metadata: {
				source: 'mock',
				fetchedAt: Date.now()
			}
		}
	}

	/**
	 * Generate mock contribution data (53 weeks)
	 */
	function generateMockContributions() {
		const weeks = []
		const now = new Date()
		const endDate = new Date(now)
		endDate.setDate(endDate.getDate() - endDate.getDay())

		const startDate = new Date(endDate)
		startDate.setDate(startDate.getDate() - 52 * 7)

		const currentDate = new Date(startDate)

		for (let week = 0; week < 53; week++) {
			const weekData = {
				weekStart: new Date(currentDate).toISOString().split('T')[0],
				days: []
			}

			for (let day = 0; day < 7; day++) {
				const isInFuture = currentDate > now
				const dayCount = isInFuture
					? 0
					: Math.floor(Math.random() * 15)

				weekData.days.push({
					date: new Date(currentDate).toISOString().split('T')[0],
					count: dayCount
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
		const diffHours = Math.floor((now - date) / (1000 * 60 * 60))

		if (diffHours < 1) return 'just now'
		if (diffHours < 24) return `${diffHours} hours ago`

		const diffDays = Math.floor(diffHours / 24)
		if (diffDays === 1) return 'yesterday'
		if (diffDays < 7) return `${diffDays} days ago`

		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
		})
	})

	/**
	 * Computed data source display text
	 */
	const dataSourceText = computed(() => {
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
		loadData,
		cacheData
	}
}