/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                background: '#0A0A1A',
                card: '#14142B',
                accent: {
                    violet: '#5900ff', // Main Call-to-action
                    pink: '#ff007f',   // Highlights/Metrics
                    cyan: '#00e5ff',   // Informational
                    emerald: '#00ff7f' // Success states
                }
            },
            fontFamily: {
                'InterTight': ['InterTight-Regular', 'sans-serif'],
                'InterTight-Medium': ['InterTight-Medium', 'sans-serif'],
                'InterTight-SemiBold': ['InterTight-SemiBold', 'sans-serif'],
                'InterTight-Bold': ['InterTight-Bold', 'sans-serif'],
            },
            spacing: {
                '17': '4.25rem', // Support for pt-17
            }
        },
    },
    plugins: [],
}
