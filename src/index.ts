// Main entry point for vue-git-stats

import type { App } from 'vue'
import ContributionGraph from './components/ContributionGraph.vue'
import StatsBreakdown from './components/StatsBreakdown.vue'
import { useGitStats } from './composables/useGitStats'
import {
	generateDummyStats,
	generateDummyContributions,
	generateMultiProfileDummyStats,
	saveDummyDataToFile,
} from './utils/generateDummyData'

// Export types
export type * from './types'

// Auto-import styles
import './styles/index.css'

// Export components
export {
	ContributionGraph,
	StatsBreakdown,
	useGitStats,
	generateDummyStats,
	generateDummyContributions,
	generateMultiProfileDummyStats,
	saveDummyDataToFile,
}

// Plugin for Vue.use()
export interface VueGitStatsPlugin {
	install: (app: App) => void
}

const VueGitStats: VueGitStatsPlugin = {
	install(app: App) {
		app.component('ContributionGraph', ContributionGraph)
		app.component('StatsBreakdown', StatsBreakdown)
	},
}

// Export as default for Vue.use()
export default VueGitStats
