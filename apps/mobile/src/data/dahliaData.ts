export interface Persona {
    id: string;
    name: string;
    specialization: string;
    description: string;
    type: 'Warm' | 'Direct' | 'Strategic';
    icon: 'neutral' | 'male' | 'female';
    avatar: any;
}

export const PERSONAS: Persona[] = [
    {
        id: 'dahlia',
        name: 'Dahlia',
        specialization: 'Supportive mentor',
        description: 'Encouraging, asks reflective questions to help you grow',
        type: 'Warm',
        icon: 'neutral',
        avatar: require('@/assets/avatars/dahlia.png'),
    },
    {
        id: 'alex',
        name: 'Alex',
        specialization: 'Tech career specialist',
        description: 'Direct and focused on technical career growth paths',
        type: 'Direct',
        icon: 'male',
        avatar: require('@/assets/avatars/alex.png'),
    },
    {
        id: 'susan',
        name: 'Susan',
        specialization: 'Strategic thinker',
        description: 'Helps you plan long-term career moves with precision',
        type: 'Strategic',
        icon: 'female',
        avatar: require('@/assets/avatars/susan.png'),
    },
];

export const MOCK_INSIGHTS = [
    'Programming fundamentals',
    'Algorithms & data structures',
    'Version control (Git)',
    'Web & backend development',
    'System design',
];

export const MOCK_QUOTES = [
    'You mentioned wanting to pivot to marketing as a new career path..',
    'Can you generate a compilation of materials relating to this role for me',
    'How long can it take me to become a professional in the new role, with the current experience i have',
];

export const MOCK_TRANSCRIPTION = [
    { speaker: 'user', text: "I'm looking to transition into product management role, could you help me understand what skill i need?" },
    { speaker: 'dahlia', text: "That's a great choice! Product management requires a blend of technical, business, and leadership skills. To start, how familiar are you with agile methodologies?" },
    { speaker: 'user', text: "I've heard of them but haven't used them in a professional setting yet." },
    { speaker: 'dahlia', text: "No problem. We can focus on that. You also mentioned wanting to pivot to marketing earlier—product management actually sits at the intersection of those fields." }
];
