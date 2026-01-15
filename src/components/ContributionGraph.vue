<template>
	<div class="git-contribution-graph">
		<!-- Header -->
		<div class="graph-header">
			<div class="header-info">
				<h5 class="contribution-count">
					{{ totalContributions.toLocaleString() }} contributions in
					the last year
				</h5>
				<small
					class="data-source-text"
					:class="{ 'is-dummy': isDummy }"
				>
					{{ dataSourceText }}
				</small>
			</div>
			<div class="header-actions" v-if="showSettings">
				<button
					class="settings-btn"
					type="button"
					@click="toggleSettings"
				>
					<slot name="settings-icon">⚙️</slot>
					Settings
				</button>
				<div v-if="settingsOpen" class="settings-dropdown">
					<button
						v-for="scheme in colorSchemes"
						:key="scheme"
						@click="changeColorScheme(scheme)"
						class="settings-item"
					>
						{{ scheme }} theme
					</button>
				</div>
			</div>
		</div>

		<!-- Loading state -->
		<div v-if="loading" class="loading-state">
			<div class="spinner"></div>
			<span>Loading contributions...</span>
		</div>

		<!-- Contribution grid -->
		<div v-else class="graph-container">
			<div class="graph-content-wrapper">
				<!-- Month labels -->
				<div class="months-row">
					<div class="month-spacer"></div>
					<div class="months-container">
						<div
							v-for="month in monthLabels"
							:key="`${month.year}-${month.month}`"
							class="month-label"
							:style="{
								gridColumn: `${month.week + 1} / span 1`,
							}"
						>
							{{ month.label }}
						</div>
					</div>
				</div>

				<!-- Grid with day labels -->
				<div class="grid-container">
					<!-- Day labels -->
					<div class="day-labels">
						<div class="day-label">Mon</div>
						<div class="day-label"></div>
						<div class="day-label">Wed</div>
						<div class="day-label"></div>
						<div class="day-label">Fri</div>
						<div class="day-label"></div>
						<div class="day-label"></div>
					</div>

					<!-- Contribution squares -->
					<div class="contribution-grid">
						<div
							v-for="week in contributionData"
							:key="week.weekStart"
							class="contribution-week"
						>
							<div
								v-for="day in week.days"
								:key="day.date"
								class="contribution-day"
								:class="getContributionLevel(day.count)"
								:title="getTooltipText(day)"
								@click="onDayClick(day)"
							></div>
						</div>
					</div>
				</div>
			</div>

			<!-- Legend -->
			<div class="graph-footer">
				<small class="last-updated" v-if="lastUpdatedText">
					Last updated: {{ lastUpdatedText }}
				</small>
				<div class="legend">
					<small class="legend-label">Less</small>
					<div class="legend-squares">
						<div class="contribution-day level-0"></div>
						<div class="contribution-day level-1"></div>
						<div class="contribution-day level-2"></div>
						<div class="contribution-day level-3"></div>
						<div class="contribution-day level-4"></div>
					</div>
					<small class="legend-label">More</small>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useGitStats } from '../composables/useGitStats'
import type { ColorScheme, ContributionWeek } from '../types'

interface ProcessedWeek {
	weekStart: string
	days: ProcessedDay[]
}

interface ProcessedDay {
	date: string
	count: number
	weekday: number
}

interface MonthLabel {
	week: number
	month: number
	year: number
	label: string
}

interface Props {
	dataUrl?: string
	profileIndex?: number
	colorScheme?: ColorScheme
	showSettings?: boolean
	cacheTTL?: number
}

interface Emits {
	(e: 'day-click', data: { date: string; count: number }): void
	(e: 'color-scheme-change', scheme: ColorScheme): void
}

const props = withDefaults(defineProps<Props>(), {
	dataUrl: '/data/git-stats.json',
	profileIndex: 0,
	colorScheme: 'green',
	showSettings: true,
	cacheTTL: 24 * 60 * 60 * 1000,
})

const emit = defineEmits<Emits>()

// Use the shared composable
const { data, loading, dataSourceText, lastUpdatedText, isDummy } = useGitStats(
	{
		dataUrl: props.dataUrl,
		cacheTTL: props.cacheTTL,
	}
)

const currentColorScheme = ref<ColorScheme>(props.colorScheme)
const settingsOpen = ref(false)
const colorSchemes: ColorScheme[] = ['green', 'blue', 'purple', 'orange']
const contributionData = ref<ProcessedWeek[]>([])
const monthLabels = ref<MonthLabel[]>([])

// Process contribution data when loaded
watch(
	data,
	(newData) => {
		if (newData?.profiles?.[props.profileIndex]?.stats?.contributions) {
			const contributions =
				newData.profiles[props.profileIndex].stats.contributions
			if (contributions) {
				contributionData.value = processContributions(contributions)
				generateMonthLabels()
			}
		} else {
			contributionData.value = []
		}
	},
	{ immediate: true }
)

const totalContributions = computed(() => {
	if (!contributionData.value || contributionData.value.length === 0) {
		return 0
	}

	return contributionData.value.reduce((total, week) => {
		if (!week.days || !Array.isArray(week.days)) {
			return total
		}
		return (
			total +
			week.days.reduce((weekTotal, day) => {
				return weekTotal + (day.count || 0)
			}, 0)
		)
	}, 0)
})

function processContributions(
	contributions: ContributionWeek[]
): ProcessedWeek[] {
	if (!contributions || !Array.isArray(contributions)) {
		return generateEmptyWeeks()
	}

	const weeks = contributions.map((week) => ({
		weekStart: week.firstDay || '',
		days: week.contributionDays.map((day) => ({
			date: day.date || '',
			count: day.contributionCount ?? 0,
			weekday: day.weekday || 0,
		})),
	}))

	while (weeks.length < 53) {
		weeks.push(generateEmptyWeek())
	}

	return weeks
}

function generateEmptyWeeks(): ProcessedWeek[] {
	const weeks: ProcessedWeek[] = []
	for (let i = 0; i < 53; i++) {
		weeks.push(generateEmptyWeek())
	}
	return weeks
}

function generateEmptyWeek(): ProcessedWeek {
	const days: ProcessedDay[] = []
	for (let i = 0; i < 7; i++) {
		days.push({
			date: '',
			count: 0,
			weekday: i,
		})
	}
	return {
		weekStart: '',
		days,
	}
}

function generateMonthLabels(): void {
	if (!contributionData.value || contributionData.value.length === 0) {
		monthLabels.value = []
		return
	}

	const monthPositions: MonthLabel[] = []
	let lastMonth = -1
	let lastYear = -1

	contributionData.value.forEach((week, weekIndex) => {
		if (!week.days || week.days.length === 0) return

		const firstDay = week.days[0].date
		if (!firstDay) return

		const dateParts = firstDay.split('-')
		if (dateParts.length !== 3) return

		const [year, month] = dateParts.map(Number)
		if (isNaN(year) || isNaN(month)) return

		if (month !== lastMonth || year !== lastYear) {
			const date = new Date(year, month - 1, 1)
			monthPositions.push({
				week: weekIndex,
				month: month - 1,
				year: year,
				label: date.toLocaleDateString('en-US', {
					month: 'short',
				}),
			})
			lastMonth = month
			lastYear = year
		}
	})

	monthLabels.value = monthPositions
}

function getContributionLevel(count: number): string {
	const level = getContributionLevelNumber(count)
	return `level-${level} ${currentColorScheme.value}`
}

function getContributionLevelNumber(count: number): number {
	if (count === 0) return 0
	if (count <= 3) return 1
	if (count <= 6) return 2
	if (count <= 9) return 3
	return 4
}

function getTooltipText(day: ProcessedDay): string {
	if (!day.date) return ''

	const [year, month, dayNum] = day.date.split('-').map(Number)
	const date = new Date(year, month - 1, dayNum)

	const formattedDate = date.toLocaleDateString('en-US', {
		weekday: 'short',
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	})

	const contributionText = day.count === 1 ? 'contribution' : 'contributions'
	return `${day.count} ${contributionText} on ${formattedDate}`
}

function onDayClick(day: ProcessedDay): void {
	emit('day-click', {
		date: day.date,
		count: day.count,
	})
}

function toggleSettings(): void {
	settingsOpen.value = !settingsOpen.value
}

function changeColorScheme(scheme: ColorScheme): void {
	currentColorScheme.value = scheme
	settingsOpen.value = false
	emit('color-scheme-change', scheme)
}
</script>

<style scoped>
.graph-content-wrapper {
	justify-items: anchor-center;
}
.git-contribution-graph {
	font-family:
		-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica,
		Arial, sans-serif;
	font-size: 12px;
	background: transparent;
	color: #e6edf3;
	padding: 16px;
	max-width: 1200px;
	margin: 0 auto;
	width: 100%;
}

.graph-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16px;
}

.contribution-count {
	margin: 0 0 4px 0;
	font-size: 16px;
	font-weight: 600;
}

.data-source-text {
	color: #7d8590;
}

.data-source-text.is-dummy {
	color: #f85149;
	font-weight: 600;
	background: rgba(248, 81, 73, 0.1);
	padding: 2px 8px;
	border-radius: 4px;
}

.settings-btn {
	background: transparent;
	border: 1px solid #30363d;
	color: #7d8590;
	padding: 6px 12px;
	border-radius: 6px;
	cursor: pointer;
	font-size: 12px;
}

.settings-btn:hover {
	background: #21262d;
	color: #e6edf3;
}

.header-actions {
	position: relative;
}

.settings-dropdown {
	position: absolute;
	right: 0;
	top: 100%;
	margin-top: 4px;
	background: #21262d;
	border: 1px solid #30363d;
	border-radius: 6px;
	padding: 4px;
	z-index: 10;
	min-width: 150px;
}

.settings-item {
	display: block;
	width: 100%;
	background: transparent;
	border: none;
	color: #e6edf3;
	padding: 8px 12px;
	text-align: left;
	cursor: pointer;
	border-radius: 4px;
}

.settings-item:hover {
	background: #30363d;
}

.loading-state {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12px;
	padding: 40px;
	color: #7d8590;
}

.spinner {
	width: 20px;
	height: 20px;
	border: 2px solid #30363d;
	border-top-color: #58a6ff;
	border-radius: 50%;
	animation: spin 1s linear infinite;
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}

.months-row {
	display: flex;
	margin-bottom: 4px;
}

.month-spacer {
	width: 27px;
	flex-shrink: 0;
}

.months-container {
	display: grid;
	grid-template-columns: repeat(53, 11px);
	gap: 2px;
	flex: 1;
	margin-left: 3px;
	min-width: 0;
}

.month-label {
	font-size: 11px;
	color: #7d8590;
	text-align: left;
}

.grid-container {
	display: flex;
	gap: 3px;
	min-width: fit-content;
}

.day-labels {
	display: flex;
	flex-direction: column;
	width: 24px;
	gap: 2px;
	flex-shrink: 0;
}

.day-label {
	height: 11px;
	font-size: 9px;
	color: #7d8590;
	display: flex;
	align-items: center;
}

.contribution-grid {
	display: flex;
	gap: 2px;
	flex: 1;
	min-width: 0;
}

.contribution-week {
	display: flex;
	flex-direction: column;
	gap: 2px;
	flex-shrink: 0;
}

.contribution-day {
	width: 11px;
	height: 11px;
	border-radius: 2px;
	cursor: pointer;
	outline: 1px solid rgba(27, 31, 36, 0.06);
	outline-offset: -1px;
	flex-shrink: 0;
}

/* Color schemes */
.contribution-day.level-0.green {
	background-color: #161b22;
}
.contribution-day.level-1.green {
	background-color: #0e4429;
}
.contribution-day.level-2.green {
	background-color: #006d32;
}
.contribution-day.level-3.green {
	background-color: #26a641;
}
.contribution-day.level-4.green {
	background-color: #39d353;
}

.contribution-day.level-0.blue {
	background-color: #161b22;
}
.contribution-day.level-1.blue {
	background-color: #0a3069;
}
.contribution-day.level-2.blue {
	background-color: #1f6feb;
}
.contribution-day.level-3.blue {
	background-color: #58a6ff;
}
.contribution-day.level-4.blue {
	background-color: #79c0ff;
}

.contribution-day.level-0.purple {
	background-color: #161b22;
}
.contribution-day.level-1.purple {
	background-color: #3b1e6d;
}
.contribution-day.level-2.purple {
	background-color: #8250df;
}
.contribution-day.level-3.purple {
	background-color: #a475f9;
}
.contribution-day.level-4.purple {
	background-color: #d2a8ff;
}

.contribution-day.level-0.orange {
	background-color: #161b22;
}
.contribution-day.level-1.orange {
	background-color: #7d2d00;
}
.contribution-day.level-2.orange {
	background-color: #da7b00;
}
.contribution-day.level-3.orange {
	background-color: #ffa348;
}
.contribution-day.level-4.orange {
	background-color: #ffb366;
}

.contribution-day:hover {
	outline: 1px solid #c9d1d9;
	outline-offset: -1px;
}

.graph-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-top: 8px;
}

.last-updated {
	color: #7d8590;
}

.legend {
	display: flex;
	align-items: center;
	gap: 4px;
}

.legend-label {
	color: #7d8590;
}

.legend-squares {
	display: flex;
	gap: 2px;
}

.legend-squares .contribution-day {
	cursor: default;
}

.legend-squares .contribution-day:hover {
	outline: none;
}

/* Mobile responsive */
@media (max-width: 768px) {
	.git-contribution-graph {
		padding: 12px;
		font-size: 11px;
		overflow-x: auto;
	}

	.months-container {
		grid-template-columns: repeat(53, 10px);
		gap: 1px;
	}

	.grid-container {
		gap: 2px;
	}

	.day-labels {
		width: 20px;
	}

	.day-label {
		height: 10px;
		font-size: 8px;
	}

	.contribution-grid {
		gap: 1px;
	}

	.contribution-week {
		gap: 1px;
	}

	.contribution-day {
		width: 10px;
		height: 10px;
	}

	.settings-btn {
		font-size: 10px;
		padding: 4px 8px;
	}

	.contribution-count {
		font-size: 14px;
	}
}

@media (max-width: 480px) {
	.graph-header {
		flex-direction: column;
		align-items: flex-start;
		gap: 8px;
	}
}
</style>
