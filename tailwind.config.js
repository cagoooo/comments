/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            // ── 點石成金蜂 設計系統（A+D Fusion）── 對應 src/styles/tokens.css
            colors: {
                ink: {
                    DEFAULT: 'var(--ink)',
                    soft: 'var(--ink-soft)',
                    mute: 'var(--ink-mute)',
                },
                paper: {
                    DEFAULT: 'var(--paper)',
                    2: 'var(--paper-2)',
                },
                honey: {
                    DEFAULT: 'var(--honey)',
                    soft: 'var(--honey-soft)',
                },
                coral: {
                    DEFAULT: 'var(--coral)',
                    soft: 'var(--coral-soft)',
                },
                mint: {
                    DEFAULT: 'var(--mint)',
                    soft: 'var(--mint-soft)',
                },
                sky: {
                    DEFAULT: 'var(--sky)',
                    soft: 'var(--sky-soft)',
                },
                lav: {
                    DEFAULT: 'var(--lav)',
                    soft: 'var(--lav-soft)',
                },
                peach: {
                    DEFAULT: 'var(--peach)',
                    soft: 'var(--peach-soft)',
                },
            },
            borderRadius: {
                card: 'var(--r-card)', // 16px
                btn: 'var(--r-btn)',   // 10px
            },
            boxShadow: {
                card: 'var(--shadow-card)', // 3px 3px 0 var(--ink)
                btn: 'var(--shadow-btn)',   // 2px 2px 0 var(--ink)
                sm0: 'var(--shadow-sm)',    // 1.5px 1.5px 0 var(--ink)
            },
            fontFamily: {
                sans: ['"Noto Sans TC"', '"Inter"', 'system-ui', 'sans-serif'],
                mono: ['"JetBrains Mono"', 'monospace'],
            },
        },
    },
    plugins: [],
}
