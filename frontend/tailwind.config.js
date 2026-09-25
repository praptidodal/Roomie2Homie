export default {content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      colors: {
        navy: {
          DEFAULT: '#111827',
          900: '#111827',
          800: '#1B2433',
          700: '#2A3546',
          600: '#3C4A61',
          500: '#5A6880',
        },
        violet: {
          50: '#F5F0FF',
          100: '#EBE2FF',
          200: '#D8C7FF',
          300: '#B99BFB',
          400: '#9A6DF5',
          500: '#7C3AED',
          600: '#6926D6',
          700: '#551CAE',
        },
        coral: {
          50: '#FFF1F0',
          100: '#FFE1DE',
          200: '#FFC4BF',
          300: '#FF9E96',
          400: '#FF6B6B',
          500: '#F04E4E',
          600: '#D13A3A',
        },
        mint: {
          50: '#EEFDFA',
          100: '#D3F9F2',
          200: '#A5F0E4',
          300: '#5FE0CD',
          400: '#2DD4BF',
          500: '#17B3A0',
          600: '#0E8C7E',
        },
        cream: {
          DEFAULT: '#FFF8F0',
          100: '#FFFCF8',
          200: '#FFF8F0',
          300: '#F7EDE1',
        },
      },
      boxShadow: {
        soft: '0 2px 6px rgba(17,24,39,0.04), 0 16px 40px -20px rgba(17,24,39,0.18)',
        lift: '0 24px 50px -24px rgba(124,58,237,0.35)',
        ring: '0 0 0 4px rgba(124,58,237,0.12)',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      backgroundImage: {
        'violet-coral': 'linear-gradient(120deg, #7C3AED 0%, #A855F7 45%, #FF6B6B 100%)',
        'violet-mint': 'linear-gradient(120deg, #7C3AED 0%, #2DD4BF 100%)',
      },
    },
  },
}
