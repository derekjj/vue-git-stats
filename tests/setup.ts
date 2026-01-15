import { expect, afterEach } from 'vitest'
import { config } from '@vue/test-utils'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Configure Vue Test Utils
config.global.stubs = {
	teleport: true,
}

// Cleanup after each test
afterEach(() => {
	// Clear localStorage
	localStorage.clear()
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: (query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => {},
	}),
})
