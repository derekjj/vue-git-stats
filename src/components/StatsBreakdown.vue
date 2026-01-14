<template>
	<div class="git-stats-breakdown">
		<div class="stats-grid">
			<!-- Years Experience -->
			<div class="stat-card">
				<div class="stat-icon">
					<slot name="icon-experience">⏱️</slot>
				</div>
				<div class="stat-content">
					<div class="stat-value">
						{{ yearsExperience }}
					</div>
					<div class="stat-label">Years Experience</div>
				</div>
			</div>

			<!-- Projects -->
			<div class="stat-card">
				<div class="stat-icon">
					<slot name="icon-projects">📦</slot>
				</div>
				<div class="stat-content">
					<div v-if="loading" class="stat-loading">
						<div class="spinner"></div>
					</div>
					<div v-else class="stat-value">
						{{ totalProjects }}
					</div>
					<div class="stat-label">Projects</div>
				</div>
			</div>

			<!-- Commits -->
			<div class="stat-card">
				<div class="stat-icon">
					<slot name="icon-commits">💻</slot>
				</div>
				<div class="stat-content">
					<div v-if="loading" class="stat-loading">
						<div class="spinner"></div>
					</div>
					<div v-else class="stat-value">
						{{ totalCommits }}
					</div>
					<div class="stat-label">Commits</div>
				</div>
			</div>

			<!-- Custom Stat (Coffee, or anything) -->
			<div class="stat-card" v-if="showCustomStat">
				<div class="stat-icon">
					<slot name="icon-custom">☕</slot>
				</div>
				<div class="stat-content">
					<div v-if="loading" class="stat-loading">
						<div class="spinner"></div>
					</div>
					<div v-else class="stat-value">
						{{ customStatValue }}
					</div>
					<div class="stat-label">
						<slot name="custom-stat-label">Coffee Consumed</slot>
					</div>
				</div>
			</div>
		</div>

		<!-- Footer -->
		<div class="stats-footer">
			<small v-if="dataSourceText" class="data-source">
				{{ dataSourceText }}
				<span v-if="lastUpdatedText"> · {{ lastUpdatedText }}</span>
			</small>
		</div>
	</div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useGitStats } from '../composables/useGitStats'

export default {
	name: 'StatsBreakdown',
	props: {
		// Data source URL
		dataUrl: {
			type: String,
			default: '/data/git-stats.json',
		},
		// Which profiles to aggregate (empty = all)
		profileIndexes: {
			type: Array,
			default: () => [],
		},
		// Experience data (for years calculation)
		experienceData: {
			type: Array,
			default: () => [],
		},
		// Show custom stat (coffee consumption)
		showCustomStat: {
			type: Boolean,
			default: true,
		},
		// Custom stat calculation function
		customStatCalculator: {
			type: Function,
			default: null,
		},
		// Cache configuration
		cacheTTL: {
			type: Number,
			default: 24 * 60 * 60 * 1000,
		},
	},
	setup(props) {
		// Use the shared composable
		const { data, loading, dataSourceText, lastUpdatedText } = useGitStats({
			dataUrl: props.dataUrl,
			cacheTTL: props.cacheTTL,
		})

		const totalProjects = ref(0)
		const totalCommits = ref(0)

		// Calculate totals when data loads
		watch(
			data,
			(newData) => {
				if (!newData) return

				// If profileIndexes specified, sum only those profiles
				if (props.profileIndexes.length > 0) {
					let projects = 0
					let commits = 0

					props.profileIndexes.forEach((index) => {
						const profile = newData.profiles?.[index]
						if (profile?.stats) {
							projects += profile.stats.projectCount || 0
							commits += profile.stats.commitCount || 0
						}
					})

					totalProjects.value = projects
					totalCommits.value = commits
				} else {
					// Use totals from data (aggregates all profiles)
					totalProjects.value = newData.totals?.projectCount || 0
					totalCommits.value = newData.totals?.commitCount || 0
				}
			},
			{ immediate: true }
		)

		// Calculate years of experience from experience data
		const yearsExperience = computed(() => {
			if (props.experienceData.length === 0) return '0.0'

			const skillExperience = {}

			props.experienceData.forEach((exp) => {
				const durationYears = calculateYears(exp.startDate, exp.endDate)
				exp.skills?.forEach((skill) => {
					if (!skillExperience[skill]) {
						skillExperience[skill] = 0
					}
					skillExperience[skill] += durationYears
				})
			})

			// Get the highest skill experience
			const maxYears = Math.max(...Object.values(skillExperience), 0)
			return maxYears.toFixed(1)
		})

		// Custom stat calculation (e.g., coffee consumed)
		const customStatValue = computed(() => {
			if (props.customStatCalculator) {
				return props.customStatCalculator({
					projects: totalProjects.value,
					commits: totalCommits.value,
					years: parseFloat(yearsExperience.value),
				})
			}

			// Default: fun coffee calculation
			const kA = 1.5 // Coffee per project
			const kB = 1.2 // Coffee per commit
			const kC = 1.5 // Coffee per year

			const cups =
				totalProjects.value * kA +
				totalCommits.value * kB +
				parseFloat(yearsExperience.value) * kC

			return cups.toFixed(2)
		})

		function calculateYears(startDate, endDate) {
			endDate = endDate || new Date()
			const millisecondsPerYear = 1000 * 60 * 60 * 24 * 365.25
			const durationMilliseconds = new Date(endDate) - new Date(startDate)
			return durationMilliseconds / millisecondsPerYear
		}

		return {
			loading,
			dataSourceText,
			lastUpdatedText,
			totalProjects,
			totalCommits,
			yearsExperience,
			customStatValue,
		}
	},
}
</script>

<style scoped>
.git-stats-breakdown {
	font-family:
		-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica,
		Arial, sans-serif;
	padding: 40px 20px;
	max-width: 1200px;
	margin: 0 auto;
}

.stats-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 24px;
	margin-bottom: 24px;
}

.stat-card {
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 24px;
	background: rgba(255, 255, 255, 0.05);
	border-radius: 12px;
	border: 1px solid rgba(255, 255, 255, 0.1);
	transition: all 0.3s ease;
}

.stat-card:hover {
	background: rgba(255, 255, 255, 0.08);
	border-color: rgba(255, 255, 255, 0.2);
	transform: translateY(-2px);
}

.stat-icon {
	font-size: 48px;
	line-height: 1;
	opacity: 0.9;
	flex-shrink: 0;
}

.stat-content {
	flex: 1;
	min-width: 0;
}

.stat-value {
	font-size: 32px;
	font-weight: bold;
	line-height: 1.2;
	color: #e6edf3;
	margin-bottom: 4px;
}

.stat-label {
	font-size: 14px;
	color: #7d8590;
	text-transform: uppercase;
	letter-spacing: 0.5px;
}

.stat-loading {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 38px;
}

.spinner {
	width: 24px;
	height: 24px;
	border: 3px solid rgba(255, 255, 255, 0.1);
	border-top-color: #58a6ff;
	border-radius: 50%;
	animation: spin 1s linear infinite;
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}

.stats-footer {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	padding-top: 16px;
	border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.data-source {
	font-size: 12px;
	color: #7d8590;
	text-align: center;
}

/* Responsive */
@media (max-width: 768px) {
	.git-stats-breakdown {
		padding: 20px 12px;
	}

	.stats-grid {
		grid-template-columns: 1fr;
		gap: 16px;
	}

	.stat-card {
		padding: 16px;
	}

	.stat-icon {
		font-size: 36px;
	}

	.stat-value {
		font-size: 24px;
	}

	.stat-label {
		font-size: 12px;
	}
}

@media (max-width: 480px) {
	.stat-card {
		flex-direction: column;
		text-align: center;
	}

	.stat-content {
		width: 100%;
	}
}

/* Dark mode support (if needed) */
@media (prefers-color-scheme: light) {
	.stat-card {
		background: rgba(0, 0, 0, 0.03);
		border-color: rgba(0, 0, 0, 0.1);
	}

	.stat-card:hover {
		background: rgba(0, 0, 0, 0.05);
		border-color: rgba(0, 0, 0, 0.15);
	}

	.stat-value {
		color: #1f2328;
	}

	.spinner {
		border-color: rgba(0, 0, 0, 0.1);
		border-top-color: #0969da;
	}
}
</style>
