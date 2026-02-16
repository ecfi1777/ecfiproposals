import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"], // kept for shadcn compatibility
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
			sidebar: {
				DEFAULT: 'hsl(var(--sidebar-background))',
				foreground: 'hsl(var(--sidebar-foreground))',
				primary: 'hsl(var(--sidebar-primary))',
				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
				accent: 'hsl(var(--sidebar-accent))',
				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
				border: 'hsl(var(--sidebar-border))',
				ring: 'hsl(var(--sidebar-ring))'
			},
			'ecfi-std-green': 'hsl(var(--ecfi-std-green))',
			'ecfi-std-green-text': 'hsl(var(--ecfi-std-green-text))',
			'ecfi-vol-blue': 'hsl(var(--ecfi-vol-blue))',
			'ecfi-vol-blue-text': 'hsl(var(--ecfi-vol-blue-text))',
			'ecfi-wall-purple': 'hsl(var(--ecfi-wall-purple))',
			'ecfi-wall-purple-text': 'hsl(var(--ecfi-wall-purple-text))',
			'ecfi-ftg-orange': 'hsl(var(--ecfi-ftg-orange))',
			'ecfi-ftg-orange-text': 'hsl(var(--ecfi-ftg-orange-text))',
			'ecfi-slab-green': 'hsl(var(--ecfi-slab-green))',
			'ecfi-slab-green-text': 'hsl(var(--ecfi-slab-green-text))',
			'ecfi-override-orange': 'hsl(var(--ecfi-override-orange))',
			'ecfi-override-orange-text': 'hsl(var(--ecfi-override-orange-text))',
			'ecfi-danger': 'hsl(var(--ecfi-danger))',
			'ecfi-danger-text': 'hsl(var(--ecfi-danger-text))',
			'ecfi-nav-bg': 'hsl(var(--ecfi-nav-bg))',
			'ecfi-nav-border': 'hsl(var(--ecfi-nav-border))',
			'ecfi-panel-bg': 'hsl(var(--ecfi-panel-bg))',
			'ecfi-panel-border': 'hsl(var(--ecfi-panel-border))',
			'ecfi-input-bg': 'hsl(var(--ecfi-input-bg))',
			'ecfi-input-border': 'hsl(var(--ecfi-input-border))',
			'ecfi-dropdown-bg': 'hsl(var(--ecfi-dropdown-bg))',
			'ecfi-dropdown-border': 'hsl(var(--ecfi-dropdown-border))',
			'ecfi-dropdown-hover': 'hsl(var(--ecfi-dropdown-hover))',
			'ecfi-tab-bg': 'hsl(var(--ecfi-tab-bg))',
			'ecfi-tab-active-bg': 'hsl(var(--ecfi-tab-active-bg))',
			'ecfi-row-number': 'hsl(var(--ecfi-row-number))',
			'ecfi-subtle': 'hsl(var(--ecfi-subtle))',
			'ecfi-vol-breakdown-bg': 'hsl(var(--ecfi-vol-breakdown-bg))',
			'ecfi-vol-breakdown-border': 'hsl(var(--ecfi-vol-breakdown-border))',
			'ecfi-preview-bg': 'hsl(var(--ecfi-preview-bg))',
			'ecfi-preview-panel': 'hsl(var(--ecfi-preview-panel))',
			'ecfi-preview-border': 'hsl(var(--ecfi-preview-border))',
			'ecfi-vol-tint': 'hsl(var(--ecfi-vol-tint))',
			'ecfi-ftg-tint': 'hsl(var(--ecfi-ftg-tint))',
			'ecfi-wall-tint': 'hsl(var(--ecfi-wall-tint))',
			'ecfi-slab-tint': 'hsl(var(--ecfi-slab-tint))',
			'ecfi-override-tint': 'hsl(var(--ecfi-override-tint))'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		},
  		boxShadow: {
  			'2xs': 'var(--shadow-2xs)',
  			xs: 'var(--shadow-xs)',
  			sm: 'var(--shadow-sm)',
  			md: 'var(--shadow-md)',
  			lg: 'var(--shadow-lg)',
  			xl: 'var(--shadow-xl)',
  			'2xl': 'var(--shadow-2xl)'
  		},
  		fontFamily: {
  			sans: [
  				'Poppins',
  				'ui-sans-serif',
  				'system-ui',
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'Segoe UI',
  				'Roboto',
  				'Helvetica Neue',
  				'Arial',
  				'Noto Sans',
  				'sans-serif'
  			],
  			serif: [
  				'Merriweather',
  				'ui-serif',
  				'Georgia',
  				'Cambria',
  				'Times New Roman',
  				'Times',
  				'serif'
  			],
  			mono: [
  				'JetBrains Mono',
  				'ui-monospace',
  				'SFMono-Regular',
  				'Menlo',
  				'Monaco',
  				'Consolas',
  				'Liberation Mono',
  				'Courier New',
  				'monospace'
  			]
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
