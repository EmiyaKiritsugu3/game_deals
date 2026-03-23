import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        surface: 'hsl(var(--surface))',
        'deal-free': {
          DEFAULT: 'hsl(var(--deal-free))',
          foreground: 'hsl(var(--deal-free-foreground))',
          muted: 'hsl(var(--deal-free-muted))',
        },
        'deal-flash': {
          DEFAULT: 'hsl(var(--deal-flash))',
          foreground: 'hsl(var(--deal-flash-foreground))',
          muted: 'hsl(var(--deal-flash-muted))',
        },
        'brand-google': 'hsl(var(--brand-google))',
        'brand-discord': 'hsl(var(--brand-discord))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      animation: {
        'pulse-slow': 'pulseIcon 2s infinite',
      },
      keyframes: {
        pulseIcon: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.1)', opacity: '0.8' },
        },
      }
    },
  },
  plugins: [],
};

export default config;