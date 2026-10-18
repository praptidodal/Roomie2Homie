export default {content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Outfit', '"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        handwriting: ['"Reenie Beanie"', 'cursive'],
      },
      colors: {
        wellness: {
          DEFAULT: '#FDFCF8',
          dark: '#292524',
          muted: '#78716C',
        },
        sage: {
          50: '#F4F7F4',
          100: '#E8EFE8',
          200: '#D2E0D2',
          500: '#5D7A5D',
        },
        lavender: {
          50: '#F8F7FA',
          100: '#EFEDF4',
          200: '#DDD7E8',
          500: '#6E5D87',
        },
        peach: {
          50: '#FFF5F4',
          100: '#FFE5E3',
          200: '#FFB7B2',
          500: '#E06A62',
        },
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
        soft: '0 4px 20px -2px rgba(0,0,0,0.05)',
        'soft-legacy': '0 2px 6px rgba(17,24,39,0.04), 0 16px 40px -20px rgba(17,24,39,0.18)',
        floating: '0 12px 36px -4px rgba(41,37,36,0.08)',
        hover: '0 20px 40px -8px rgba(41,37,36,0.12)',
        lift: '0 20px 40px -20px rgba(41,37,36,0.14)',
        ring: '0 0 0 4px rgba(41,37,36,0.08)',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
        '6xl': '3rem',
      },
      keyframes: {
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
      },
      animation: {
        'float-slow': 'float-slow 6s ease-in-out infinite',
      },
    },
  },
}
