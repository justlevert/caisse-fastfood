/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Nouvelle palette Fast-Food
        primary: {
          50: '#FFE5DC',
          100: '#FFCBB8',
          200: '#FFB194',
          300: '#FF9770',
          400: '#FF7D4C',
          500: '#FF6B35', // Principal
          600: '#E85A2A',
          700: '#D14920',
          800: '#BA3816',
          900: '#A3270C',
        },
        success: {
          50: '#D4F7ED',
          100: '#A9EFDB',
          200: '#7EE7C9',
          300: '#53DFB7',
          400: '#28D7A5',
          500: '#06D6A0', // Principal
          600: '#05C090',
          700: '#04AA80',
          800: '#039470',
          900: '#027E60',
        },
        danger: {
          50: '#FFE5E7',
          100: '#FFCCCF',
          200: '#FFB2B7',
          300: '#FF999F',
          400: '#FF7F87',
          500: '#E63946', // Principal
          600: '#D62839',
          700: '#C6172C',
          800: '#B6061F',
          900: '#A60012',
        },
        info: {
          50: '#E0F4F9',
          100: '#C1E9F3',
          200: '#A2DEED',
          300: '#83D3E7',
          400: '#64C8E1',
          500: '#118AB2', // Principal
          600: '#0F7A9D',
          700: '#0D6A88',
          800: '#0B5A73',
          900: '#094A5E',
        },
        warning: {
          50: '#FFF5E0',
          100: '#FFEBC1',
          200: '#FFE1A2',
          300: '#FFD783',
          400: '#FFCD64',
          500: '#FFD166', // Principal
          600: '#F0C356',
          700: '#E1B546',
          800: '#D2A736',
          900: '#C39926',
        },
      },
    },
  },
  plugins: [],
}
