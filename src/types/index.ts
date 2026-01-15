/**
 * Core type definitions for vue-git-stats
 */

export type Platform = 'github' | 'gitlab' | 'bitbucket'

export type ColorScheme = 'green' | 'blue' | 'purple' | 'orange'

export type DataSource = 'static' | 'cache' | 'mock' | 'dummy'

export interface ContributionDay {
	date: string
	contributionCount: number
	weekday: number
}

export interface ContributionWeek {
	firstDay: string
	contributionDays: ContributionDay[]
}

export interface ProfileStats {
	projectCount: number
	commitCount: number
	contributions?: ContributionWeek[]
}

export interface Profile {
	username: string
	platform: Platform
	stats: ProfileStats
}

export interface StatsTotals {
	projectCount: number
	commitCount: number
}

export interface StatsMetadata {
	fetchedAt: number
	source: string
	isDummy?: boolean
}

export interface GitStatsData {
	lastUpdated: string
	profiles: Profile[]
	totals: StatsTotals
	metadata: StatsMetadata
	cachedAt?: number
}

export interface ExperienceEntry {
	startDate: string
	endDate: string | null
	skills?: string[]
}

export interface GitStatsConfig {
	dataUrl?: string
	cacheTTL?: number
	useStaleCache?: boolean
	cacheKey?: string
}

export interface UseGitStatsReturn {
	data: Ref<GitStatsData | null>
	loading: Ref<boolean>
	error: Ref<Error | null>
	dataSource: Ref<DataSource | null>
	dataSourceText: ComputedRef<string>
	lastUpdatedText: ComputedRef<string>
	isDummy: Ref<boolean>
	loadData: () => Promise<GitStatsData | null>
	cacheData: (data: GitStatsData) => void
}

export interface DummyStatsOptions {
	username?: string
	platform?: Platform
	projectCount?: number
	commitCount?: number
}

export interface CustomStatCalculatorParams {
	projects: number
	commits: number
	years: number
}

export type CustomStatCalculator = (
	params: CustomStatCalculatorParams
) => string | number

// Import Ref and ComputedRef types from Vue
import type { Ref, ComputedRef } from 'vue'

// Config file types
export interface ProfileConfig {
	username: string
	platform: Platform
	tokenSecret: string
}

export interface DisplayConfig {
	colorScheme?: ColorScheme
	showPrivateContributions?: boolean
}

export interface FeaturesConfig {
	contributionGraph?: boolean
	statsBreakdown?: boolean
}

export interface CacheConfig {
	browserTTL?: number
	useStaleCache?: boolean
}

export interface GitStatsUserConfig {
	profiles: ProfileConfig[]
	dataPath: string
	schedule: string
	display?: DisplayConfig
	features?: FeaturesConfig
	cache?: CacheConfig
}
