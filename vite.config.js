import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
	plugins: [vue()],
	build: {
		lib: {
			entry: resolve(__dirname, 'src/index.js'),
			name: 'VueGitStats',
			fileName: (format) => `vue-git-stats.${format}.js`
		},
		rollupOptions: {
			// Externalize deps that shouldn't be bundled
			external: ['vue'],
			output: {
				// Global vars to use in UMD build for externalized deps
				globals: {
					vue: 'Vue'
				},
				// Export CSS separately
				assetFileNames: (assetInfo) => {
					if (assetInfo.name === 'style.css') return 'style.css'
					return assetInfo.name
				}
			}
		},
		// Generate sourcemaps for debugging
		sourcemap: true,
		// Ensure compatibility
		target: 'es2015'
	},
	resolve: {
		alias: {
			'@': resolve(__dirname, 'src')
		}
	}
})