export interface Question {
    id: number;
    section: string;
    question: string;
    options: string[];
}

export const CAREER_APTITUDE_QUESTIONS: Question[] = [
    // Section 1: Work Style
    {
        id: 1,
        section: "Work Style",
        question: "Your ideal work environment is one where:",
        options: [
            "Quiet focused spaces",
            "Strategy rooms and boardrooms",
            "Care-centered facilities",
            "Open creative studios",
            "Hands-on technical workspaces",
            "Team collaboration hubs"
        ]
    },
    {
        id: 2,
        section: "Work Style",
        question: "When solving problems, you prefer to:",
        options: [
            "Take things apart to find the source of the problem",
            "Look at the numbers and track down patterns",
            "Talk to people to understand what they need",
            "Draw out or map different possible solutions",
            "Start small and test each piece of the solution",
            "Gather feedback to find the best approach"
        ]
    },
    {
        id: 3,
        section: "Work Style",
        question: "You're most energized when:",
        options: [
            "Working through complex code",
            "Optimizing business performance",
            "Improving patient outcomes",
            "Exploring design concepts",
            "Building working solutions",
            "Shaping market trends"
        ]
    },
    {
        id: 4,
        section: "Work Style",
        question: "In team settings, you naturally:",
        options: [
            "Find system weaknesses",
            "Guide team priorities",
            "Foster collaboration",
            "Drive creative vision",
            "Design solutions",
            "Craft compelling stories"
        ]
    },
    {
        id: 5,
        section: "Work Style",
        question: "You excel at handling:",
        options: [
            "Complex technical puzzles",
            "Making key decisions",
            "People's wellbeing needs",
            "Pushing creative limits",
            "Developing systems and structures",
            "Analyzing trend shifts and changes"
        ]
    },
    
    // Section 2: Skills & Abilities
    {
        id: 6,
        section: "Skills & Abilities",
        question: "Your strongest natural abilities are:",
        options: [
            "Mathematical and logical thinking",
            "Strategic planning and analysis",
            "Understanding people's needs",
            "Visual and creative expression",
            "Technical problem-solving",
            "Communication and persuasion"
        ]
    },
    {
        id: 7,
        section: "Skills & Abilities",
        question: "When analyzing information, you excel at:",
        options: [
            "Finding patterns in data",
            "Connecting market signals and ROI potential",
            "Recognizing care patterns",
            "Visualizing user flows",
            "Detecting technical issues",
            "Understanding consumer behavior signals"
        ]
    },
    {
        id: 8,
        section: "Skills & Abilities",
        question: "Your approach to learning new skills is:",
        options: [
            "Deep technical immersion",
            "Business scenario analysis",
            "Through practice scenarios",
            "By experimenting creatively",
            "Through technical documentation",
            "Industry trend research"
        ]
    },
    {
        id: 9,
        section: "Skills & Abilities",
        question: "In challenging situations, you typically:",
        options: [
            "Troubleshoot systematically",
            "Assess risks and opportunities",
            "Focus on people's wellbeing",
            "Try different approaches",
            "Build step-by-step solutions",
            "Find consensus and alignment"
        ]
    },
    {
        id: 10,
        section: "Skills & Abilities",
        question: "Your problem-solving strength is:",
        options: [
            "Test hypotheses and isolate issues",
            "Model scenarios and calculate risks",
            "Balance patient and staff needs",
            "Push boundaries and explore edges",
            "Design systems and scale processes",
            "Study behaviors and drive actions"
        ]
    },

    // Section 3: Knowledge & Interests
    {
        id: 11,
        section: "Knowledge & Interests",
        question: "You most enjoy learning about:",
        options: [
            "How things work",
            "What drives success",
            "Ways to improve wellbeing",
            "New creative techniques",
            "Building better solutions",
            "Why people make choices"
        ]
    },
    {
        id: 12,
        section: "Knowledge & Interests",
        question: "When reading for work, you prefer:",
        options: [
            "Code documentation and developer guides",
            "Financial reports and industry news",
            "Patient care studies and protocols",
            "Design portfolios and style guides",
            "System specifications and manuals",
            "Consumer data and market research"
        ]
    },
    {
        id: 13,
        section: "Knowledge & Interests",
        question: "You're most likely to take courses in:",
        options: [
            "Software development and code languages",
            "Financial modeling and business administration",
            "Clinical management",
            "User experience and design thinking",
            "Structure design and systems architecture",
            "Campaign design and digital strategy"
        ]
    },
    {
        id: 14,
        section: "Knowledge & Interests",
        question: "Your internet browsing often includes:",
        options: [
            "Code libraries and dev forums",
            "Investment trends",
            "Healthcare discoveries and research",
            "Creative inspiration galleries",
            "New technologies and inventions",
            "Marketing trends and social data"
        ]
    },
    {
        id: 15,
        section: "Knowledge & Interests",
        question: "In work discussions, you focus on:",
        options: [
            "System improvements and efficiencies",
            "Business opportunities and strategies",
            "Patient experience and outcomes",
            "Creative concepts and solutions",
            "Project challenges and approaches",
            "Audience engagement and impact"
        ]
    },

    // Section 4: Values & Motivations
    {
        id: 16,
        section: "Values & Motivations",
        question: "You feel most accomplished when:",
        options: [
            "Cracking tough code",
            "Exceeding growth targets",
            "Advancing patient care",
            "Creating something unique",
            "Building functional solutions",
            "Driving decisions"
        ]
    },
    {
        id: 17,
        section: "Values & Motivations",
        question: "Your work motivation comes from:",
        options: [
            "Solving complex problems",
            "Achieving ambitious goals",
            "Making people's lives better",
            "Creative freedom",
            "System innovation",
            "Market impact"
        ]
    },
    {
        id: 18,
        section: "Values & Motivations",
        question: "You value work that:",
        options: [
            "Pushes technical boundaries",
            "Drives organizational change",
            "Strengthens community health",
            "Redefines possible",
            "Creates solid foundations",
            "Shapes outcomes"
        ]
    },
    {
        id: 19,
        section: "Values & Motivations",
        question: "Your ideal project would involve:",
        options: [
            "Building innovative systems",
            "Scale successful ventures",
            "Transforming patient experience",
            "Designing breakthrough concepts",
            "Crafting pivotal solutions",
            "Shaping popular narratives"
        ]
    },
    {
        id: 20,
        section: "Values & Motivations",
        question: "Success to you means:",
        options: [
            "Finding elegant solutions",
            "Delivering measurable results",
            "Improving quality of life",
            "Making lasting impact",
            "Building something that lasts",
            "Moving people to action"
        ]
    }
];
