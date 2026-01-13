# Integrating vue-git-stats into Your Portfolio

This guide shows how to integrate `vue-git-stats` into your existing portfolio.

## Installation

```bash
npm install vue-git-stats
```

## Initialize

```bash
npx vue-git-stats init
```

This creates:

- `git-stats.config.js`
- `.github/workflows/update-git-stats.yml`
- `public/data/` directory

## Configure

Edit `git-stats.config.js`:

```javascript
export default {
	profiles: [
		{
			username: 'derekjj',
			platform: 'github',
			tokenSecret: 'GITHUB_TOKEN',
		},
		{
			username: 'DerekJJ',
			platform: 'gitlab',
			tokenSecret: 'TOKEN_GITLAB', // Use your existing secret name
		},
	],
	dataPath: 'public/data/git-stats.json',
	schedule: '0 2 * * *',
}
```

## Update Your Index Page

**Before (your current code):**

```vue
<template lang="pug">
.container-fluid
  section(id="gitHeatmap" ref="gitHeatmap") 
    RepositoryContributions(
      data-url="/data/contributions.json"
      color-scheme="green"
      @day-click="handleDayClick")
      
  section(id="break-down" ref="break-down")
    BreakDown(data-url="/data/stats.json")
</template>

<script>
export default {
	methods: {
		handleDayClick(data) {
			console.log('Day clicked:', data)
		},
	},
}
</script>
```

**After (using vue-git-stats):**

```vue
<template lang="pug">
.container-fluid
  section(id="gitHeatmap" ref="gitHeatmap")
    .container
      ContributionGraph(
        data-url="/data/git-stats.json"
        color-scheme="green"
        @day-click="handleDayClick"
        @color-scheme-change="handleColorSchemeChange")
      
  section(id="break-down" ref="break-down")
    StatsBreakdown(
      data-url="/data/git-stats.json"
      :experience-data="about.exps"
      :show-custom-stat="true")
</template>

<script>
import { ContributionGraph, StatsBreakdown } from 'vue-git-stats'
import 'vue-git-stats/style.css'
import jsonAbout from '@/assets/about.json'

export default {
	components: {
		ContributionGraph,
		StatsBreakdown,
	},
	data() {
		return {
			about: jsonAbout.about,
		}
	},
	methods: {
		handleDayClick(data) {
			console.log('Day clicked:', data)
		},
		handleColorSchemeChange(scheme) {
			console.log('Color scheme:', scheme)
			localStorage.setItem('git-stats-theme', scheme)
		},
	},
}
</script>
```

## Styling Integration

The components are designed to blend with your existing styles. You can customize:

```css
/* In your global styles or component */
.git-contribution-graph {
	/* Match your site's background */
	background: transparent;
	/* Or use your dark theme color */
	background: #0d1117;
}

.git-stats-breakdown {
	/* Customize card colors to match your theme */
}

.stat-card {
	/* Match your card styles */
	background: rgba(255, 255, 255, 0.05);
	border: 1px solid rgba(255, 255, 255, 0.1);
}
```

## Pass Experience Data

The `StatsBreakdown` component can use your existing experience data:

```javascript
// In your about.json
{
  "about": {
    "exps": [
      {
        "startDate": "2020-01-01",
        "endDate": null, // null = present
        "skills": ["JavaScript", "Vue", "Node.js"]
      }
    ]
  }
}
```

Then pass it to the component:

```vue
<StatsBreakdown data-url="/data/git-stats.json" :experience-data="about.exps" />
```

## Custom Coffee Calculation

Want a different "fun stat"? Pass a custom calculator:

```vue
<StatsBreakdown
	data-url="/data/git-stats.json"
	:custom-stat-calculator="calculatePizzas"
>
  <template #icon-custom>🍕</template>
  <template #custom-stat-label>Pizzas Ordered</template>
</StatsBreakdown>
```

```javascript
methods: {
  calculatePizzas({ projects, commits, years }) {
    // Your custom calculation
    return (projects * 2 + commits * 0.5 + years * 100).toFixed(0)
  }
}
```

## Multiple Profiles

Show stats from different platforms separately:

```vue
<template lang="pug">
section.github-stats
  h2 GitHub Activity
  ContributionGraph(
    data-url="/data/git-stats.json"
    :profile-index="0"
    color-scheme="green")
    
section.gitlab-stats
  h2 GitLab Activity
  ContributionGraph(
    data-url="/data/git-stats.json"
    :profile-index="1"
    color-scheme="orange")
</template>
```

## Migration Checklist

- [ ] Install `vue-git-stats`
- [ ] Run `npx vue-git-stats init`
- [ ] Update `git-stats.config.js` with your usernames
- [ ] Add GitHub secrets (GITHUB_TOKEN auto-exists, add GITLAB_TOKEN if needed)
- [ ] Update components in your pages
- [ ] Import the CSS
- [ ] Test the workflow manually (Actions → Run workflow)
- [ ] Remove old component files (RepositoryContributions.vue, BreakDown.vue)
- [ ] Remove old workflow files
- [ ] Update imports across your project
- [ ] Test locally
- [ ] Deploy!

## Troubleshooting

### "Module not found: vue-git-stats"

- Run `npm install vue-git-stats`
- Restart your dev server

### Styles look wrong

- Import the CSS: `import 'vue-git-stats/style.css'`
- Check that CSS is loading in browser DevTools

### Data not loading

- Verify `data-url` prop points to correct file
- Check that workflow has run (go to Actions tab)
- Look in browser console for errors

### Workflow fails

- Verify secrets are added to GitHub
- Check that usernames in config are correct
- Review workflow logs for specific errors

## Benefits of Migration

✅ **Maintained package** - Get updates and bug fixes  
✅ **Less code** - Remove custom components from your repo  
✅ **Better tested** - Used by multiple developers  
✅ **More features** - New features added over time  
✅ **Documentation** - Comprehensive docs and examples  
✅ **Community** - Get help from other users

## Keep Your Custom Styling

The library is designed to be unstyled by default, so your existing portfolio styles will work. The components use:

- Transparent backgrounds
- Inherit font families
- Flexible layouts
- CSS custom properties for easy theming

Your existing dark theme, colors, and spacing will automatically apply!

---

Need help? Open an issue on the vue-git-stats repo!
