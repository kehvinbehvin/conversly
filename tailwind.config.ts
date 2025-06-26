import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar-background)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        // Custom warm color palette
        "warm-brown": {
          50: "var(--warm-brown-50)",
          100: "var(--warm-brown-100)",
          200: "var(--warm-brown-200)",
          300: "var(--warm-brown-300)",
          400: "var(--warm-brown-400)",
          500: "var(--warm-brown-500)",
          600: "var(--warm-brown-600)",
          700: "var(--warm-brown-700)",
          800: "var(--warm-brown-800)",
          900: "var(--warm-brown-900)",
        },
        coral: {
          50: "var(--coral-50)",
          100: "var(--coral-100)",
          200: "var(--coral-200)",
          300: "var(--coral-300)",
          400: "var(--coral-400)",
          500: "var(--coral-500)",
          600: "var(--coral-600)",
          700: "var(--coral-700)",
          800: "var(--coral-800)",
          900: "var(--coral-900)",
        },
        sage: {
          50: "var(--sage-50)",
          100: "var(--sage-100)",
          200: "var(--sage-200)",
          300: "var(--sage-300)",
          400: "var(--sage-400)",
          500: "var(--sage-500)",
          600: "var(--sage-600)",
          700: "var(--sage-700)",
          800: "var(--sage-800)",
          900: "var(--sage-900)",
        },
      },
      spacing: {
        'space-1': 'var(--space-1)',
        'space-2': 'var(--space-2)', 
        'space-3': 'var(--space-3)',
        'space-4': 'var(--space-4)',
        'space-6': 'var(--space-6)',
        'space-8': 'var(--space-8)',
        'space-12': 'var(--space-12)',
        'space-16': 'var(--space-16)',
        'space-20': 'var(--space-20)',
      },
      fontSize: {
        'display-1': ['var(--font-size-4xl)', { lineHeight: 'var(--line-height-tight)' }],
        'display-2': ['var(--font-size-3xl)', { lineHeight: 'var(--line-height-tight)' }],
        'heading-1': ['var(--font-size-2xl)', { lineHeight: 'var(--line-height-tight)' }],
        'heading-2': ['var(--font-size-xl)', { lineHeight: 'var(--line-height-normal)' }],
        'heading-3': ['var(--font-size-lg)', { lineHeight: 'var(--line-height-normal)' }],
        'body-large': ['var(--font-size-lg)', { lineHeight: 'var(--line-height-relaxed)' }],
        'body': ['var(--font-size-base)', { lineHeight: 'var(--line-height-normal)' }],
        'body-small': ['var(--font-size-sm)', { lineHeight: 'var(--line-height-normal)' }],
        'caption': ['var(--font-size-xs)', { lineHeight: 'var(--line-height-normal)' }],
      },
      boxShadow: {
        'shadow-sm': 'var(--shadow-sm)',
        'shadow-base': 'var(--shadow-base)',
        'shadow-md': 'var(--shadow-md)',
        'shadow-lg': 'var(--shadow-lg)',
        'shadow-xl': 'var(--shadow-xl)',
      },
      width: {
        'conversation': '1152px', // 72rem - desktop fixed width
        'conversation-md': '100%',  // 100% of available container width for tablet 
        'conversation-sm': '100%',  // 100% of available container width for mobile
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
