// Main entry point for vue-git-stats

import ContributionGraph from './components/ContributionGraph.vue'
import StatsBreakdown from './components/StatsBreakdown.vue'
import { useGitStats } from './composables/useGitStats'

// Auto-import styles
import './styles/index.css'

// Export components
export { ContributionGraph, StatsBreakdown, useGitStats }

// Export install function for Vue.use()
export default {
	install(app) {
		app.component('ContributionGraph', ContributionGraph)
		app.component('StatsBreakdown', StatsBreakdown)
	}
}