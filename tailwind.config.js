const { hairlineWidth } = require('nativewind/theme');

/** iOS-style design tokens. Colors are CSS variables defined in global.css. */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        grouped: 'hsl(var(--grouped))',
        card: 'hsl(var(--card))',
        foreground: 'hsl(var(--foreground))',
        secondary: 'hsl(var(--secondary))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        separator: 'hsl(var(--separator))',
        primary: 'hsl(var(--primary))',
        'primary-foreground': 'hsl(var(--primary-foreground))',
        destructive: 'hsl(var(--destructive))',
      },
      borderRadius: {
        ios: '12px',
        'ios-lg': '16px',
      },
      borderWidth: {
        hairline: hairlineWidth(),
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
