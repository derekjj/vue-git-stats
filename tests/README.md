# Test Suite

This directory contains the test suite for vue-git-stats using Vitest and Vue Testing Library.

## Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

```
tests/
├── setup.js                          # Test setup and global config
├── components/
│   ├── ContributionGraph.test.js    # ContributionGraph component tests
│   └── StatsBreakdown.test.js       # StatsBreakdown component tests
├── composables/
│   └── useGitStats.test.js          # useGitStats composable tests
└── utils/
    └── generateDummyData.test.js    # Utility function tests
```

## Test Coverage

The test suite covers:

- **Utility Functions** (generateDummyData.js)
    - Dummy contribution generation
    - Single and multi-profile stats generation
    - Data validation
    - Edge cases

- **Composable** (useGitStats.js)
    - Data loading from static files
    - Caching to localStorage
    - Fallback mechanisms (cache → mock)
    - Dummy data detection
    - Time formatting

- **Components**
    - ContributionGraph.vue
        - Rendering and loading states
        - Color scheme switching
        - Day click events
        - Settings dropdown
        - Data source indicators
    - StatsBreakdown.vue
        - Stats display
        - Experience calculation
        - Custom stat calculators
        - Multi-profile aggregation
        - Custom slots

## Writing Tests

### Component Test Example

```javascript
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@testing-library/vue'
import MyComponent from '../MyComponent.vue'

describe('MyComponent', () => {
	it('should render correctly', () => {
		const wrapper = mount(MyComponent)
		expect(wrapper.exists()).toBe(true)
	})
})
```

### Composable Test Example

```javascript
import { describe, it, expect } from 'vitest'
import { useMyComposable } from '../useMyComposable'

describe('useMyComposable', () => {
	it('should return expected values', () => {
		const { data } = useMyComposable()
		expect(data.value).toBeDefined()
	})
})
```

## Mocking

### Fetch API

Tests mock the global `fetch` API:

```javascript
global.fetch = vi.fn(() =>
	Promise.resolve({
		ok: true,
		json: () => Promise.resolve(mockData),
	})
)
```

### LocalStorage

LocalStorage is automatically cleared after each test via `setup.js`.

## Coverage Goals

Target coverage:

- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

## CI/CD Integration

Tests run automatically in CI pipelines. Add this to your workflow:

```yaml
- name: Run tests
  run: npm run test:run

- name: Generate coverage
  run: npm run test:coverage
```

## Tips

- Use `vi.waitFor()` for async operations
- Mock external dependencies
- Test edge cases and error states
- Keep tests focused and independent
- Use descriptive test names

## Debugging Tests

```bash
# Run specific test file
npm test -- ContributionGraph.test.js

# Run tests matching pattern
npm test -- --grep "should render"

# Debug in UI mode
npm run test:ui
```
