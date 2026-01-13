# Testing Guide

## Quick Test in Your Project

### 1. Generate Dummy Data

```javascript
import { generateDummyStats, saveDummyDataToFile } from 'vue-git-stats'

// Generate and save dummy data
const dummyData = generateDummyStats({
	username: 'your-username',
	platform: 'github',
	projectCount: 30,
	commitCount: 2500,
})

// Save to file (in Node.js)
saveDummyDataToFile('public/data/git-stats.json')

// Or manually create the file with this data
console.log(JSON.stringify(dummyData, null, 2))
```

### 2. Use Components with Dummy Data

```vue
<template>
	<div>
		<ContributionGraph
			data-url="/data/git-stats.json"
			color-scheme="green"
		/>

		<StatsBreakdown
			data-url="/data/git-stats.json"
			:experience-data="experienceData"
		/>
	</div>
</template>

<script setup>
import { ContributionGraph, StatsBreakdown } from 'vue-git-stats'
import 'vue-git-stats/style.css'

const experienceData = [
	{
		startDate: '2020-01-01',
		endDate: null, // current
		skills: ['JavaScript', 'Vue', 'Node.js'],
	},
]
</script>
```

### 3. Indicators

When using dummy data, you'll see:

- **⚠️ Using dummy data for testing** - Red warning badge
- Yellow/orange highlighting on the data source text

This makes it clear you're not looking at real data yet.

## Testing Checklist

### Visual Tests

- [ ] Components render without errors
- [ ] Contribution graph shows 53 weeks
- [ ] Stats show numbers (not 0 or NaN)
- [ ] Dummy data warning is visible
- [ ] Color scheme changes work
- [ ] Responsive on mobile/desktop

### Functional Tests

- [ ] Clicking days triggers events
- [ ] Settings dropdown works
- [ ] Month labels display correctly
- [ ] Tooltips show on hover
- [ ] Data loads from JSON file
- [ ] Fallback to cache works
- [ ] Mock data displays if file missing

### Integration Tests

- [ ] Works in Nuxt/Vue app
- [ ] CSS doesn't conflict with site styles
- [ ] Components work with Pug templates
- [ ] Works with existing Bootstrap/Tailwind
- [ ] SSR compatible (if applicable)

## Debugging

### Components don't render

```javascript
// Check if package is installed
import { ContributionGraph } from 'vue-git-stats'
console.log('Component:', ContributionGraph)

// Check if data is loading
import { useGitStats } from 'vue-git-stats'
const { data, loading, error, isDummy } = useGitStats({
	dataUrl: '/data/git-stats.json',
})
console.log({ data, loading, error, isDummy })
```

### Styles don't apply

Make sure you're importing the CSS:

```javascript
import 'vue-git-stats/style.css'
```

Or check in your browser DevTools that `style.css` is loaded.

### Data shows as "Using sample data"

This means the JSON file couldn't be loaded. Check:

1. File exists at the path specified in `data-url` prop
2. File is in `public/` directory (for Vite/Nuxt)
3. File path is correct (should start with `/`)
4. No CORS issues (check browser console)

## Demo Page

We've included a demo page at `demo/index.html`. To test:

```bash
# Build the library
npm run build

# Serve the demo
npx serve .

# Open browser to http://localhost:3000/demo/
```

The demo page will:

- ✅ Show both components working
- ✅ Use dummy data automatically
- ✅ Let you download dummy data file
- ✅ Show setup instructions
- ✅ Verify interactivity

## Create Test Data File

Run this script to create dummy data in your project:

```javascript
// scripts/generate-dummy-data.js
import { generateDummyStats } from 'vue-git-stats'
import fs from 'fs'

const data = generateDummyStats({
	username: 'your-username',
	platform: 'github',
	projectCount: 30,
	commitCount: 2500,
})

fs.writeFileSync('public/data/git-stats.json', JSON.stringify(data, null, '\t'))

console.log('✓ Dummy data created at public/data/git-stats.json')
```

Then run:

```bash
node scripts/generate-dummy-data.js
```

## Common Issues

### "Cannot find module 'vue-git-stats'"

- Run `npm install vue-git-stats`
- Restart dev server
- Clear node_modules cache: `rm -rf node_modules && npm install`

### Components show but no data

- Check browser console for errors
- Verify data file path
- Check network tab for 404s
- Try using dummy data first to isolate the issue

### Dummy warning doesn't go away

- Make sure your real data file has `metadata.isDummy: false` or doesn't have this field
- The dummy generator sets `isDummy: true` intentionally
- Real data from GitHub Actions won't have this field

## Next Steps

Once dummy data works:

1. Run `npx vue-git-stats init` to create workflow
2. Configure `git-stats.config.js`
3. Add GitHub secrets
4. Trigger workflow manually
5. Replace dummy data with real data
6. Dummy warning should disappear!

---

Still having issues? [Open an issue](https://github.com/derekjj/vue-git-stats/issues) with:

- Your Vue/Nuxt version
- Browser console errors
- Network tab screenshot
- Minimal reproduction code
