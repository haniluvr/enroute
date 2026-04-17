import { create } from 'twrnc';

const tw = create({
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
                'InterTight': 'InterTight-Regular',
                'InterTight-Medium': 'InterTight-Medium',
                'InterTight-SemiBold': 'InterTight-SemiBold',
                'InterTight-Bold': 'InterTight-Bold',
                'inter': 'InterTight-Regular',
                'inter-medium': 'InterTight-Medium',
                'inter-semibold': 'InterTight-SemiBold',
                'inter-bold': 'InterTight-Bold',
            },
            spacing: {
                '17': '4.25rem',
            }
        }
    }
});

export default tw;
