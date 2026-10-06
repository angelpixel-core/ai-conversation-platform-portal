/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/presentation/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        neo: {
          bg: '#FAF9F6',
          darkBg: '#0F172A',
          yellow: '#FBBF24',
          blue: '#3B82F6',
          green: '#10B981',
          red: '#EF4444',
          amber: '#F59E0B',
          purple: '#8B5CF6',
        },
      },
      boxShadow: {
        'neo-sm': '2px 2px 0px #000000',
        neo: '4px 4px 0px #000000',
        'neo-lg': '6px 6px 0px #000000',
        'neo-sm-dark': '2px 2px 0px #FFFFFF',
        'neo-dark': '4px 4px 0px #FFFFFF',
        'neo-lg-dark': '6px 6px 0px #FFFFFF',
      },
    },
  },
  plugins: [],
};
