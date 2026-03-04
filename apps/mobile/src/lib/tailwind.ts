import { create } from 'twrnc';

const tw = create({
    theme: {
        extend: {
            colors: {
                background: '#111111', // Charcoal black
                card: '#1F1F2E',
                accent: {
                    teal: '#2b4e50',   // Deep teal
                    purple: '#B900C2', // Vibrant purple
                    grey: '#fafafa',   // Soft grey
                    white: '#fcfcfc'   // Near white
                }
            },
            fontFamily: {
                inter: 'InterTight-Regular',
                'inter-medium': 'InterTight-Medium',
                'inter-semibold': 'InterTight-SemiBold',
                'inter-bold': 'InterTight-Bold',
            }
        }
    }
});

export default tw;
