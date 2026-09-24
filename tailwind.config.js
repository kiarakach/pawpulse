/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 4px)',
  			sm: 'calc(var(--radius) - 8px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			coral: 'hsl(var(--pp-coral))',
  			sky: 'hsl(var(--pp-sky))',
  			sun: 'hsl(var(--pp-sun))',
  			mint: 'hsl(var(--pp-mint))',
  			grape: 'hsl(var(--pp-grape))',
  			cream: 'hsl(var(--pp-cream))',
  			tan: 'hsl(var(--pp-tan))',
  			brown: 'hsl(var(--pp-brown))',
  			yellow: 'hsl(var(--pp-yellow))',
  			orange: 'hsl(var(--pp-orange))',
  			black: 'hsl(var(--pp-black))'
  		},
  		fontFamily: {
  			heading: ['var(--font-heading)'],
  			body: ['var(--font-body)'],
  			display: ['var(--font-display)'],
  			mono: ['var(--font-mono)']
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			},
  			'pop-in': {
  				from: { opacity: '0', transform: 'scale(0.85)' },
  				to: { opacity: '1', transform: 'scale(1)' }
  			},
  			'float-up': {
  				from: { opacity: '0', transform: 'translateY(14px)' },
  				to: { opacity: '1', transform: 'translateY(0)' }
  			},
  			'wiggle': {
  				'0%,100%': { transform: 'rotate(-3deg)' },
  				'50%': { transform: 'rotate(3deg)' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'pop-in': 'pop-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
  			'float-up': 'float-up 0.4s ease-out',
  			'wiggle': 'wiggle 0.6s ease-in-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
