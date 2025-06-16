import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    coverage: {
      reporter: ['text','json'],
      include: [
        'src/components/NewsCard.jsx',
        'src/components/CategoryList.jsx',
        'src/context/UserPreferencesContext.jsx'
      ]
    }
  }
})
