/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    /* Declared in full (not via `extend`) so `xs` sorts *before* `sm`.
       Extending screens appends new keys last, which would make `xs:`
       utilities win over `sm:`/`lg:` at desktop widths. */
    screens: {
      xs: '390px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      print: { raw: 'print' },
    },
    extend: {
      colors: {
        /* Semantic tokens — driven by CSS variables so light/dark are two
           distinct palettes rather than an inversion of one. */
        ivory: 'rgb(var(--c-ivory) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        'surface-raised': 'rgb(var(--c-surface-raised) / <alpha-value>)',
        charcoal: 'rgb(var(--c-charcoal) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        subtle: 'rgb(var(--c-subtle) / <alpha-value>)',
        line: 'rgb(var(--c-line) / <alpha-value>)',
        gold: 'rgb(var(--c-gold) / <alpha-value>)',
        'gold-soft': 'rgb(var(--c-gold-soft) / <alpha-value>)',
        'gold-deep': 'rgb(var(--c-gold-deep) / <alpha-value>)',
        danger: 'rgb(var(--c-danger) / <alpha-value>)',
        success: 'rgb(var(--c-success) / <alpha-value>)',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', '"Times New Roman"', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      letterSpacing: {
        luxe: '0.28em',
        wideish: '0.14em',
      },
      boxShadow: {
        card: '0 1px 2px rgb(var(--c-shadow) / 0.04), 0 12px 32px -12px rgb(var(--c-shadow) / 0.14)',
        'card-hover': '0 2px 4px rgb(var(--c-shadow) / 0.06), 0 24px 48px -16px rgb(var(--c-shadow) / 0.22)',
        portrait: '0 24px 64px -24px rgb(var(--c-shadow) / 0.45)',
        inset: 'inset 0 1px 0 0 rgb(255 255 255 / 0.06)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.75rem',
      },
      backgroundImage: {
        'gold-line': 'linear-gradient(90deg, transparent, rgb(var(--c-gold) / 0.85), transparent)',
        'gold-sheen':
          'linear-gradient(135deg, rgb(var(--c-gold) / 0.16), rgb(var(--c-gold) / 0) 42%, rgb(var(--c-gold) / 0.12))',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'none' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        float: 'float 7s ease-in-out infinite',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
};
