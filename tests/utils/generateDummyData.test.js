import { describe, it, expect, beforeEach } from 'vitest'
import {
	generateDummyContributions,
	generateDummyStats,
	generateMultiProfileDummyStats,
} from '../../src/utils/generateDummyData.js' //TODO: Use ts

describe('generateDummyContributions', () => {
	let contributions

	beforeEach(() => {
		contributions = generateDummyContributions()
	})

	it('should generate exactly 53 weeks of data', () => {
		expect(contributions).toHaveLength(53)
	})

	it('should have 7 days per week', () => {
		contributions.forEach((week) => {
			expect(week.contributionDays).toHaveLength(7)
		})
	})

	it('should have valid date format (YYYY-MM-DD)', () => {
		const dateRegex = /^\d{4}-\d{2}-\d{2}$/
		contributions.forEach((week) => {
			expect(week.weekStart).toMatch(dateRegex)
			week.contributionDays.forEach((day) => {
				expect(day.date).toMatch(dateRegex)
			})
		})
	})

	it('should have non-negative contribution counts', () => {
		contributions.forEach((week) => {
			week.contributionDays.forEach((day) => {
				expect(day.contributionCount).toBeGreaterThanOrEqual(0)
			})
		})
	})

	it('should have weekday values 0-6', () => {
		contributions.forEach((week) => {
			week.contributionDays.forEach((day, index) => {
				expect(day.weekday).toBe(index)
				expect(day.weekday).toBeGreaterThanOrEqual(0)
				expect(day.weekday).toBeLessThanOrEqual(6)
			})
		})
	})

	it('should not have contributions in the future', () => {
		const now = new Date()
		contributions.forEach((week) => {
			week.contributionDays.forEach((day) => {
				const dayDate = new Date(day.date)
				if (dayDate > now) {
					expect(day.contributionCount).toBe(0)
				}
			})
		})
	})

	it('should have fewer contributions on weekends (days 0 and 6)', () => {
		let weekdayTotal = 0
		let weekendTotal = 0
		let weekdayCount = 0
		let weekendCount = 0

		contributions.forEach((week) => {
			week.contributionDays.forEach((day) => {
				if (day.weekday === 0 || day.weekday === 6) {
					weekendTotal += day.contributionCount
					weekendCount++
				} else {
					weekdayTotal += day.contributionCount
					weekdayCount++
				}
			})
		})

		const weekdayAvg = weekdayTotal / weekdayCount
		const weekendAvg = weekendTotal / weekendCount

		// Weekday average should be higher than weekend average
		expect(weekdayAvg).toBeGreaterThan(weekendAvg)
	})
})

describe('generateDummyStats', () => {
	it('should generate stats with default values', () => {
		const stats = generateDummyStats()

		expect(stats).toHaveProperty('lastUpdated')
		expect(stats).toHaveProperty('profiles')
		expect(stats).toHaveProperty('totals')
		expect(stats).toHaveProperty('metadata')

		expect(stats.profiles).toHaveLength(1)
		expect(stats.profiles[0].username).toBe('demo-user')
		expect(stats.profiles[0].platform).toBe('github')
		expect(stats.profiles[0].stats.projectCount).toBe(30)
		expect(stats.profiles[0].stats.commitCount).toBe(2500)
	})

	it('should generate stats with custom options', () => {
		const stats = generateDummyStats({
			username: 'test-user',
			platform: 'gitlab',
			projectCount: 50,
			commitCount: 3000,
		})

		expect(stats.profiles[0].username).toBe('test-user')
		expect(stats.profiles[0].platform).toBe('gitlab')
		expect(stats.profiles[0].stats.projectCount).toBe(50)
		expect(stats.profiles[0].stats.commitCount).toBe(3000)
	})

	it('should have valid ISO 8601 timestamp', () => {
		const stats = generateDummyStats()
		const date = new Date(stats.lastUpdated)
		expect(date.toString()).not.toBe('Invalid Date')
	})

	it('should have contributions array', () => {
		const stats = generateDummyStats()
		expect(stats.profiles[0].stats.contributions).toBeInstanceOf(Array)
		expect(stats.profiles[0].stats.contributions).toHaveLength(53)
	})

	it('should have correct totals', () => {
		const stats = generateDummyStats({
			projectCount: 42,
			commitCount: 1337,
		})

		expect(stats.totals.projectCount).toBe(42)
		expect(stats.totals.commitCount).toBe(1337)
	})

	it('should mark as dummy data', () => {
		const stats = generateDummyStats()
		expect(stats.metadata.isDummy).toBe(true)
		expect(stats.metadata.source).toBe('dummy_data')
	})

	it('should have fetchedAt timestamp', () => {
		const before = Date.now()
		const stats = generateDummyStats()
		const after = Date.now()

		expect(stats.metadata.fetchedAt).toBeGreaterThanOrEqual(before)
		expect(stats.metadata.fetchedAt).toBeLessThanOrEqual(after)
	})
})

describe('generateMultiProfileDummyStats', () => {
	it('should generate multiple profiles', () => {
		const stats = generateMultiProfileDummyStats()

		expect(stats.profiles).toHaveLength(2)
		expect(stats.profiles[0].platform).toBe('github')
		expect(stats.profiles[1].platform).toBe('gitlab')
	})

	it('should aggregate totals correctly', () => {
		const stats = generateMultiProfileDummyStats()

		const expectedProjects = 45 + 7
		const expectedCommits = 2847 + 523

		expect(stats.totals.projectCount).toBe(expectedProjects)
		expect(stats.totals.commitCount).toBe(expectedCommits)
	})

	it('should have different usernames', () => {
		const stats = generateMultiProfileDummyStats()

		expect(stats.profiles[0].username).not.toBe(stats.profiles[1].username)
	})

	it('should mark as dummy data', () => {
		const stats = generateMultiProfileDummyStats()
		expect(stats.metadata.isDummy).toBe(true)
	})
})
