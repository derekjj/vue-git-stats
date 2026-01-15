/**
 * Generate realistic dummy data for testing and development
 */

import type {
	ContributionWeek,
	GitStatsData,
	DummyStatsOptions,
} from '../types'

/**
 * Generate dummy contribution data (53 weeks)
 */
export function generateDummyContributions(): ContributionWeek[] {
	const weeks: ContributionWeek[] = []
	const now = new Date()

	// Get the Sunday that starts the week containing today
	const endDate = new Date(now)
	endDate.setDate(endDate.getDate() - endDate.getDay())

	// Go back exactly 52 weeks
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
			const isWeekend = day === 0 || day === 6

			// More realistic pattern: fewer commits on weekends, none in future
			let dayCount = 0
			if (!isInFuture) {
				if (isWeekend) {
					dayCount =
						Math.random() < 0.3 ? Math.floor(Math.random() * 5) : 0
				} else {
					dayCount = Math.floor(Math.random() * 15)
				}
			}

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
 * Generate complete dummy stats data
 */
export function generateDummyStats(
	options: DummyStatsOptions = {}
): GitStatsData {
	const {
		username = 'demo-user',
		platform = 'github',
		projectCount = 30,
		commitCount = 2500,
	} = options

	const contributions = generateDummyContributions()

	return {
		lastUpdated: new Date().toISOString(),
		profiles: [
			{
				username,
				platform,
				stats: {
					projectCount,
					commitCount,
					contributions,
				},
			},
		],
		totals: {
			projectCount,
			commitCount,
		},
		metadata: {
			fetchedAt: Date.now(),
			source: 'dummy_data',
			isDummy: true,
		},
	}
}

/**
 * Generate multiple profiles dummy data
 */
export function generateMultiProfileDummyStats(): GitStatsData {
	const githubProfile = generateDummyStats({
		username: 'demo-github',
		platform: 'github',
		projectCount: 45,
		commitCount: 2847,
	})

	const gitlabProfile = generateDummyStats({
		username: 'demo-gitlab',
		platform: 'gitlab',
		projectCount: 7,
		commitCount: 523,
	})

	return {
		lastUpdated: new Date().toISOString(),
		profiles: [githubProfile.profiles[0], gitlabProfile.profiles[0]],
		totals: {
			projectCount: 45 + 7,
			commitCount: 2847 + 523,
		},
		metadata: {
			fetchedAt: Date.now(),
			source: 'dummy_data',
			isDummy: true,
		},
	}
}

/**
 * Save dummy data to a file (for testing)
 */
export function saveDummyDataToFile(
	filepath: string = 'dummy-git-stats.json'
): void {
	const data = generateDummyStats()
	const json = JSON.stringify(data, null, '\t')

	if (typeof window !== 'undefined') {
		// Browser environment - trigger download
		const blob = new Blob([json], { type: 'application/json' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = filepath
		a.click()
		URL.revokeObjectURL(url)
	} else {
		// Node environment
		try {
			// Dynamic import to avoid bundling fs
			import('fs').then((fs) => {
				fs.writeFileSync(filepath, json)
				console.log(`✓ Dummy data saved to ${filepath}`)
			})
		} catch (err) {
			console.error('Failed to save dummy data:', err)
		}
	}
}
