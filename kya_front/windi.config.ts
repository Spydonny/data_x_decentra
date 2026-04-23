// @ts-expect-error Windi's helper package does not ship local TypeScript declarations.
import { defineConfig } from 'windicss/helpers'

export default defineConfig({
  extract: {
    include: ['index.html', 'src/**/*.{vue,html,jsx,tsx}'],
  },
})
