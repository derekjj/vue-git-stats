## TypeScript Support

vue-git-stats is written in TypeScript and exports all types for full type safety.

### Using with TypeScript

```typescript
import {
  ContributionGraph,
  StatsBreakdown,
  useGitStats,
  type GitStatsData,
  type ColorScheme,
  type Platform
} from 'vue-git-stats'

// Component usage with type-safe props
<ContributionGraph
  data-url="/data/git-stats.json"
  color-scheme="blue"
  :profile-index="0"
/>

// Composable with typed return values
const { data, loading, error } = useGitStats({
  dataUrl: '/data/git-stats.json',
  cacheTTL: 3600000, // 1 hour
})

// data.value is typed as GitStatsData | null
```

### Available Types

```typescript
// Core data types
export type Platform = 'github' | 'gitlab' | 'bitbucket'
export type ColorScheme = 'green' | 'blue' | 'purple' | 'orange'

export interface GitStatsData {
	lastUpdated: string
	profiles: Profile[]
	totals: StatsTotals
	metadata: StatsMetadata
}

export interface Profile {
	username: string
	platform: Platform
	stats: ProfileStats
}

// Configuration types
export interface GitStatsConfig {
	dataUrl?: string
	cacheTTL?: number
	useStaleCache?: boolean
	cacheKey?: string
}

// And many more...
```

### Custom Stat Calculator with Types

```typescript
import type { CustomStatCalculator } from 'vue-git-stats'

const calculatePizzas: CustomStatCalculator = ({ projects, commits, years }) => {
  return (projects * 2 + commits * 0.5 + years * 100).toFixed(0)
}

<StatsBreakdown
  :custom-stat-calculator="calculatePizzas"
>
  <template #custom-stat-label>Pizzas Ordered</template>
</StatsBreakdown>
```

### Type Imports

```typescript
// Import just types (doesn't add to bundle)
import type {
	GitStatsData,
	Profile,
	ContributionWeek,
	ContributionDay,
	ExperienceEntry,
	CustomStatCalculator,
} from 'vue-git-stats'
```
