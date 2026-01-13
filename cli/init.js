#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Initialize vue-git-stats in a project
 */
async function init() {
	console.log('🚀 Initializing vue-git-stats...\n')

	try {
		// 1. Check if config exists
		const configPath = path.join(process.cwd(), 'git-stats.config.js')
		let config

		if (fs.existsSync(configPath)) {
			console.log('✓ Found existing git-stats.config.js')
			config = await import(configPath).then((m) => m.default)
		} else {
			console.log('✓ Creating git-stats.config.js...')
			const configTemplate = await fs.promises.readFile(
				path.join(__dirname, '../templates/git-stats.config.js'),
				'utf-8'
			)
			await fs.promises.writeFile(configPath, configTemplate)
			config = await import(configPath).then((m) => m.default)
		}

		// 2. Create data directory
		const dataDir = path.dirname(config.dataPath)
		if (!fs.existsSync(dataDir)) {
			console.log(`✓ Creating directory: ${dataDir}`)
			await fs.promises.mkdir(dataDir, { recursive: true })
		}

		// 3. Generate workflow file
		console.log('✓ Generating GitHub Actions workflow...')
		const workflowDir = path.join(process.cwd(), '.github/workflows')
		if (!fs.existsSync(workflowDir)) {
			await fs.promises.mkdir(workflowDir, { recursive: true })
		}

		const workflow = generateWorkflow(config)
		const workflowPath = path.join(workflowDir, 'update-git-stats.yml')
		await fs.promises.writeFile(workflowPath, workflow)

		// 4. Check for required secrets
		console.log('\n📝 Required GitHub Secrets:')
		const requiredSecrets = new Set()
		config.profiles.forEach((profile) => {
			requiredSecrets.add(profile.tokenSecret)
		})

		requiredSecrets.forEach((secret) => {
			console.log(`   - ${secret}`)
		})

		console.log('\n✨ Setup complete!\n')
		console.log('Next steps:')
		console.log('1. Add the required secrets to your GitHub repository')
		console.log('   Go to: Settings → Secrets and variables → Actions')
		console.log('2. Review and customize git-stats.config.js')
		console.log('3. Commit and push the workflow file')
		console.log(
			'4. Manually trigger the workflow or wait for the schedule\n'
		)
		console.log('Usage in your Vue components:')
		console.log(
			"  import { ContributionGraph, StatsBreakdown } from 'vue-git-stats'"
		)
		console.log(`  <ContributionGraph data-url="${config.dataPath}" />\n`)
	} catch (error) {
		console.error('❌ Error during initialization:', error.message)
		process.exit(1)
	}
}

/**
 * Generate workflow YAML from config
 */
function generateWorkflow(config) {
	const { profiles, dataPath, schedule } = config

	// Build environment variables section
	const envVars = profiles
		.map((profile) => {
			const platformUpper = profile.platform.toUpperCase()
			return `          ${platformUpper}_TOKEN: \${{ secrets.${profile.tokenSecret} }}
          ${platformUpper}_USERNAME: ${profile.username}`
		})
		.join('\n')

	// Build platform fetching logic
	const fetchLogic = profiles
		.map((profile) => {
			const platformUpper = profile.platform.toUpperCase()

			if (profile.platform === 'github') {
				return `
          # Fetch GitHub stats for ${profile.username}
          if [ -n "$${platformUpper}_TOKEN" ]; then
            echo "Fetching GitHub repositories for ${profile.username}..."
            REPOS=$(curl -s -H "Authorization: token $${platformUpper}_TOKEN" \\
              "https://api.github.com/users/${profile.username}/repos?per_page=100")
            
            REPO_COUNT=$(echo "$REPOS" | jq 'length')
            echo "Found $REPO_COUNT repositories"
            
            COMMIT_COUNT=0
            for repo in $(echo "$REPOS" | jq -r '.[].full_name'); do
              COMMITS=$(curl -s -H "Authorization: token $${platformUpper}_TOKEN" \\
                "https://api.github.com/repos/$repo/commits?per_page=100&author=${profile.username}")
              REPO_COMMITS=$(echo "$COMMITS" | jq 'length')
              COMMIT_COUNT=$((COMMIT_COUNT + REPO_COMMITS))
              sleep 1
            done
            
            # Fetch contribution graph
            CONTRIB_QUERY='{"query":"query($userName: String!, $from: DateTime!, $to: DateTime!) { user(login: $userName) { contributionsCollection(from: $from, to: $to) { contributionCalendar { weeks { contributionDays { contributionCount date } firstDay } } } } }","variables":{"userName":"${profile.username}","from":"'$(date -u -d '1 year ago' +"%Y-%m-%dT00:00:00Z")'","to":"'$(date -u +"%Y-%m-%dT23:59:59Z")'"}}'
            
            CONTRIB_DATA=$(curl -s -H "Authorization: bearer $${platformUpper}_TOKEN" \\
              -H "Content-Type: application/json" -X POST \\
              -d "$CONTRIB_QUERY" https://api.github.com/graphql)
            
            CONTRIBUTIONS=$(echo "$CONTRIB_DATA" | jq -c '.data.user.contributionsCollection.contributionCalendar.weeks')
            
            PROFILE_DATA=$(jq -n \\
              --arg username "${profile.username}" \\
              --arg platform "github" \\
              --argjson projectCount "$REPO_COUNT" \\
              --argjson commitCount "$COMMIT_COUNT" \\
              --argjson contributions "$CONTRIBUTIONS" \\
              '{ username: $username, platform: $platform, stats: { projectCount: $projectCount, commitCount: $commitCount, contributions: $contributions } }')
            
            PROFILES_JSON=$(echo "$PROFILES_JSON" | jq --argjson profile "$PROFILE_DATA" '. += [$profile]')
            TOTAL_PROJECTS=$((TOTAL_PROJECTS + REPO_COUNT))
            TOTAL_COMMITS=$((TOTAL_COMMITS + COMMIT_COUNT))
          fi`
			} else if (profile.platform === 'gitlab') {
				return `
          # Fetch GitLab stats for ${profile.username}
          if [ -n "$${platformUpper}_TOKEN" ]; then
            echo "Fetching GitLab projects for ${profile.username}..."
            PROJECTS=$(curl -s -H "Private-Token: $${platformUpper}_TOKEN" \\
              "https://gitlab.com/api/v4/users/${profile.username}/projects?per_page=100")
            
            if echo "$PROJECTS" | jq -e 'type == "array"' > /dev/null 2>&1; then
              PROJECT_COUNT=$(echo "$PROJECTS" | jq 'length')
              
              COMMIT_COUNT=0
              for project_id in $(echo "$PROJECTS" | jq -r '.[].id'); do
                COMMITS=$(curl -s -H "Private-Token: $${platformUpper}_TOKEN" \\
                  "https://gitlab.com/api/v4/projects/$project_id/repository/commits?per_page=100")
                
                if echo "$COMMITS" | jq -e 'type == "array"' > /dev/null 2>&1; then
                  PROJECT_COMMITS=$(echo "$COMMITS" | jq 'length')
                  COMMIT_COUNT=$((COMMIT_COUNT + PROJECT_COMMITS))
                fi
                sleep 1
              done
              
              PROFILE_DATA=$(jq -n \\
                --arg username "${profile.username}" \\
                --arg platform "gitlab" \\
                --argjson projectCount "$PROJECT_COUNT" \\
                --argjson commitCount "$COMMIT_COUNT" \\
                '{ username: $username, platform: $platform, stats: { projectCount: $projectCount, commitCount: $commitCount } }')
              
              PROFILES_JSON=$(echo "$PROFILES_JSON" | jq --argjson profile "$PROFILE_DATA" '. += [$profile]')
              TOTAL_PROJECTS=$((TOTAL_PROJECTS + PROJECT_COUNT))
              TOTAL_COMMITS=$((TOTAL_COMMITS + COMMIT_COUNT))
            fi
          fi`
			}

			return ''
		})
		.join('\n')

	return `name: Update Git Stats

on:
  schedule:
    - cron: '${schedule}'
  workflow_dispatch:

jobs:
  update-stats:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Fetch Git Stats
        env:
${envVars}
        run: |
          mkdir -p $(dirname ${dataPath})
          
          PROFILES_JSON="[]"
          TOTAL_PROJECTS=0
          TOTAL_COMMITS=0
          ${fetchLogic}
          
          # Generate final JSON
          jq -n \\
            --arg lastUpdated "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \\
            --argjson profiles "$PROFILES_JSON" \\
            --argjson totalProjects "$TOTAL_PROJECTS" \\
            --argjson totalCommits "$TOTAL_COMMITS" \\
            --argjson fetchedAt "$(date +%s)000" \\
            '{ lastUpdated: $lastUpdated, profiles: $profiles, totals: { projectCount: $totalProjects, commitCount: $totalCommits }, metadata: { fetchedAt: $fetchedAt, source: "github_actions" } }' > ${dataPath}
          
      - name: Format with Prettier
        run: |
          npm install
          npx prettier --write ${dataPath}
          
      - name: Check for changes
        id: git-check
        run: |
          git diff --exit-code ${dataPath} || echo "changed=true" >> $GITHUB_OUTPUT
          
      - name: Commit and push
        if: steps.git-check.outputs.changed == 'true'
        run: |
          git config --local user.email "github-actions[bot]@users.noreply.github.com"
          git config --local user.name "github-actions[bot]"
          git add ${dataPath}
          git commit -m "chore: update git stats [skip ci]"
          git push
`
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	init()
}

export { init, generateWorkflow }
