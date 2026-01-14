// git-stats.config.js
export default {
	// Git platform profiles to fetch stats from
	profiles: [
		{
			username: 'your-github-username',
			platform: 'github',
			// Secret name in GitHub Actions (not the actual token)
			tokenSecret: 'GITHUB_TOKEN',
		},
		{
			username: 'your-gitlab-username',
			platform: 'gitlab',
			tokenSecret: 'GITLAB_TOKEN',
		},
		{
			username: 'your-bitbucket-username',
			platform: 'bitbucket',
			// For Bitbucket, use an App Password
			// Create at: https://bitbucket.org/account/settings/app-passwords/
			tokenSecret: 'BITBUCKET_TOKEN',
		},
	],

	// Where to save the generated data file
	dataPath: 'public/data/git-stats.json',

	// Cron schedule for GitHub Actions (daily at 2 AM UTC)
	schedule: '0 2 * * *',

	// Display options
	display: {
		colorScheme: 'green', // 'green' | 'blue' | 'purple' | 'orange'
		showPrivateContributions: false,
	},

	// Features to enable
	features: {
		contributionGraph: true, // GitHub-style contribution heatmap
		statsBreakdown: true, // Project/commit counts
		// Future features:
		// topLanguages: false,
		// activityFeed: false
	},

	// Cache configuration
	cache: {
		// How long to cache data in browser (milliseconds)
		browserTTL: 24 * 60 * 60 * 1000, // 24 hours
		// Fallback to stale cache if fresh data unavailable
		useStaleCache: true,
	},
}
