import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        red: {
          DEFAULT: '#C0392B',
          dark:    '#922B21',
          light:   '#FADBD8',
        },
        gold: {
          DEFAULT: '#D4AC0D',
          light:   '#FCF3CF',
          dark:    '#9A7D0A',
        },
        cream: '#FDF6EC',
        sand:  '#F2E8DC',
      },
      fontFamily: {
        serif: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}

export default config