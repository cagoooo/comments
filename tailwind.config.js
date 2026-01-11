/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            animation: {
                'shake-slow': 'shake-slow 2.5s infinite ease-in-out',
            },
            keyframes: {
                'shake-slow': {
                    '0%, 100%': { transform: 'translateX(0) rotate(1deg)' },
                    '25%': { transform: 'translateX(-4px) rotate(-1deg)' },
                    '75%': { transform: 'translateX(4px) rotate(2deg)' },
                },
            },
        },
    },
    plugins: [],
}
