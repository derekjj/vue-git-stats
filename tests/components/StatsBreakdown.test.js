import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import StatsBreakdown from '../../src/components/StatsBreakdown.vue'

describe('StatsBreakdown', () => {
	const mockData = {
		lastUpdated: '2026-01-14T10:00:00Z',
		profiles: [
			{
				username: 'testuser',
				platform: 'github',
				stats: {
					projectCount: 25,
					commitCount: 1500,
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
		global.fetch = vi.fn(() =>
			Promise.resolve({
				ok: true,
				json: () => Promise.resolve(mockData),
			})
		)
	})

	it('should render without crashing', () => {
		const wrapper = mount(StatsBreakdown)
		expect(wrapper.exists()).toBe(true)
	})

	it('should display stats cards', async () => {
		const wrapper = mount(StatsBreakdown)

		await vi.waitFor(() => {
			const statCards = wrapper.findAll('.stat-card')
			// Years, Projects, Commits, Custom (4 cards by default)
			expect(statCards.length).toBeGreaterThanOrEqual(3)
		})
	})

	it('should show loading state initially', async () => {
		const wrapper = mount(StatsBreakdown)
		const spinners = wrapper.findAll('.spinner')
		expect(spinners.length).toBeGreaterThan(0)
	})

	it('should display project count after loading', async () => {
		const wrapper = mount(StatsBreakdown)

		await vi.waitFor(() => {
			const text = wrapper.text()
			expect(text).toContain('25')
			expect(text).toContain('Projects')
		})
	})

	it('should display commit count after loading', async () => {
		const wrapper = mount(StatsBreakdown)

		await vi.waitFor(() => {
			const text = wrapper.text()
			expect(text).toContain('1500')
			expect(text).toContain('Commits')
		})
	})

	it('should calculate years of experience', async () => {
		const experienceData = [
			{
				startDate: '2020-01-01',
				endDate: null, // Present
				skills: ['JavaScript', 'Vue'],
			},
		]

		const wrapper = mount(StatsBreakdown, {
			props: {
				experienceData,
			},
		})

		await vi.waitFor(() => {
			const text = wrapper.text()
			expect(text).toContain('Years Experience')
			// Should show a number greater than 0
			expect(text).toMatch(/\d+\.\d+/)
		})
	})

	it('should show custom stat when enabled', async () => {
		const wrapper = mount(StatsBreakdown, {
			props: {
				showCustomStat: true,
			},
		})

		await vi.waitFor(() => {
			const text = wrapper.text()
			// Default is coffee
			expect(text).toContain('Coffee')
		})
	})

	it('should hide custom stat when disabled', async () => {
		const wrapper = mount(StatsBreakdown, {
			props: {
				showCustomStat: false,
			},
		})

		await vi.waitFor(() => {
			const statCards = wrapper.findAll('.stat-card')
			// Should only have 3 cards (years, projects, commits)
			expect(statCards.length).toBe(3)
		})
	})

	it('should use custom stat calculator', async () => {
		const customCalculator = vi.fn(() => '42')

		const wrapper = mount(StatsBreakdown, {
			props: {
				showCustomStat: true,
				customStatCalculator: customCalculator,
			},
		})

		await vi.waitFor(() => {
			expect(customCalculator).toHaveBeenCalled()
			expect(wrapper.text()).toContain('42')
		})
	})

	it('should aggregate stats for specified profiles', async () => {
		const multiProfileData = {
			...mockData,
			profiles: [
				{
					username: 'user1',
					platform: 'github',
					stats: { projectCount: 10, commitCount: 500 },
				},
				{
					username: 'user2',
					platform: 'gitlab',
					stats: { projectCount: 15, commitCount: 1000 },
				},
			],
			totals: {
				projectCount: 25,
				commitCount: 1500,
			},
		}

		global.fetch = vi.fn(() =>
			Promise.resolve({
				ok: true,
				json: () => Promise.resolve(multiProfileData),
			})
		)

		const wrapper = mount(StatsBreakdown, {
			props: {
				profileIndexes: [0, 1],
			},
		})

		await vi.waitFor(() => {
			const text = wrapper.text()
			expect(text).toContain('25') // Total projects
			expect(text).toContain('1500') // Total commits
		})
	})

	it('should display data source information', async () => {
		const wrapper = mount(StatsBreakdown)

		await vi.waitFor(() => {
			expect(wrapper.find('.data-source').exists()).toBe(true)
		})
	})

	it('should use custom dataUrl prop', async () => {
		const customUrl = '/custom/stats.json'

		global.fetch = vi.fn((url) => {
			expect(url).toBe(customUrl)
			return Promise.resolve({
				ok: true,
				json: () => Promise.resolve(mockData),
			})
		})

		mount(StatsBreakdown, {
			props: {
				dataUrl: customUrl,
			},
		})

		await vi.waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(customUrl)
		})
	})

	it('should handle empty experience data', () => {
		const wrapper = mount(StatsBreakdown, {
			props: {
				experienceData: [],
			},
		})

		expect(wrapper.exists()).toBe(true)
	})

	it('should calculate overlapping experience correctly', async () => {
		const experienceData = [
			{
				startDate: '2020-01-01',
				endDate: '2023-01-01',
				skills: ['JavaScript'],
			},
			{
				startDate: '2021-01-01',
				endDate: null,
				skills: ['JavaScript'], // Overlapping skill
			},
		]

		const wrapper = mount(StatsBreakdown, {
			props: {
				experienceData,
			},
		})

		await vi.waitFor(() => {
			const text = wrapper.text()
			// Should show the maximum experience for JavaScript
			expect(text).toMatch(/\d+\.\d+/)
		})
	})

	it('should support custom slots for icons', async () => {
		const wrapper = mount(StatsBreakdown, {
			slots: {
				'icon-projects': '📚',
			},
		})

		await vi.waitFor(() => {
			const text = wrapper.text()
			expect(text).toContain('📚')
		})
	})

	it('should support custom slots for labels', async () => {
		const wrapper = mount(StatsBreakdown, {
			props: {
				showCustomStat: true,
			},
			slots: {
				'custom-stat-label': 'Pizzas Ordered',
			},
		})

		await vi.waitFor(() => {
			const text = wrapper.text()
			expect(text).toContain('Pizzas Ordered')
		})
	})

	it('should render stat icons', async () => {
		const wrapper = mount(StatsBreakdown)

		await vi.waitFor(() => {
			const icons = wrapper.findAll('.stat-icon')
			expect(icons.length).toBeGreaterThan(0)
		})
	})

	it('should apply correct CSS classes', async () => {
		const wrapper = mount(StatsBreakdown)

		await vi.waitFor(() => {
			expect(wrapper.find('.git-stats-breakdown').exists()).toBe(true)
			expect(wrapper.find('.stats-grid').exists()).toBe(true)
			expect(wrapper.find('.stats-footer').exists()).toBe(true)
		})
	})
})
