// tailwind.config.js

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
                inter: ['InterTight-Regular', 'sans-serif'],
                'inter-medium': ['InterTight-Medium', 'sans-serif'],
                'inter-semibold': ['InterTight-SemiBold', 'sans-serif'],
                'inter-bold': ['InterTight-Bold', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
