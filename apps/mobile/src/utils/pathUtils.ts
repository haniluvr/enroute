export interface PathMeta {
    short_description: string;
    type: 'role' | 'skill';
    icon: string;
    last_updated: string;
    clean_overview: string;
}

export function parsePathMeta(overview: string): PathMeta {
    const defaultMeta: PathMeta = {
        short_description: '',
        type: 'role',
        icon: 'Briefcase',
        last_updated: 'N/A',
        clean_overview: overview
    };

    try {
        const shortMatch = overview.match(/\[SHORT\]\s*([\s\S]*?)\s*\[\/SHORT\]/i);
        const typeMatch = overview.match(/\[TYPE\]\s*(role|skill)\s*\[\/TYPE\]/i);
        const iconMatch = overview.match(/\[ICON\]\s*(.*?)\s*\[\/ICON\]/i);
        const updatedMatch = overview.match(/\[UPDATED\]\s*(.*?)\s*\[\/UPDATED\]/i);

        // Remove tags for the cleaned overview
        const cleanOverview = overview.replace(/\[.*?\](.*?)\[\/.*?\]/g, '').trim();

        return {
            short_description: shortMatch ? shortMatch[1].trim() : defaultMeta.short_description,
            type: (typeMatch ? typeMatch[1].toLowerCase().trim() : defaultMeta.type) as 'role' | 'skill',
            icon: iconMatch ? iconMatch[1].trim() : defaultMeta.icon,
            last_updated: updatedMatch ? updatedMatch[1].trim() : defaultMeta.last_updated,
            clean_overview: cleanOverview
        };
    } catch (e) {
        return defaultMeta;
    }
}

export function parseModuleTitle(title: string): { icon: string, cleanTitle: string } {
    const match = title.match(/\[(.*?)\]\s*(.*)/);
    if (match) {
        return {
            icon: match[1],
            cleanTitle: match[2]
        };
    }
    return {
        icon: 'BookOpen',
        cleanTitle: title
    };
}

export const TITLE_DICTIONARY: Record<string, string> = {
    // Roles
    'frontend': 'Frontend Developer',
    'backend': 'Backend Developer',
    'full-stack': 'Full Stack Developer',
    'devops': 'DevOps Engineer',
    'devsecops': 'DevSecOps Engineer',
    'data-analyst': 'Data Analyst',
    'ai-engineer': 'AI Engineer',
    'ai-data-scientist': 'AI and Data Scientist',
    'data-engineer': 'Data Engineer',
    'android': 'Android Developer',
    'machine-learning': 'Machine Learning Engineer',
    'postgresql-dba': 'PostgreSQL Database Administrator',
    'ios': 'iOS Developer',
    'blockchain': 'Blockchain Developer',
    'qa': 'QA Engineer',
    'software-architect': 'Software Architect',
    'cyber-security': 'Cyber Security Expert',
    'ux-design': 'UX Designer',
    'ui-ux-designer': 'UX/UI',
    'technical-writer': 'Technical Writer',
    'game-developer': 'Game Developer',
    'server-side-game-developer': 'Server Side Game Developer',
    'mlops': 'MLOps Engineer',
    'product-manager': 'Product Manager',
    'engineering-manager': 'Engineering Manager',
    'developer-relations': 'Developer Relations',
    'bi-analyst': 'BI Analyst',

    // Skills
    'sql': 'SQL',
    'computer-science': 'Computer Science',
    'react': 'React',
    'vue': 'Vue',
    'angular': 'Angular',
    'javascript': 'JavaScript',
    'typescript': 'TypeScript',
    'nodejs': 'Node.js',
    'python': 'Python',
    'system-design': 'System Design',
    'java': 'Java',
    'aspnet-core': 'ASP.NET Core',
    'api-design': 'API Design',
    'spring-boot': 'Spring Boot',
    'flutter': 'Flutter',
    'cpp': 'C++',
    'rust': 'Rust',
    'golang': 'Go',
    'software-design-architecture': 'Software Design and Architecture',
    'graphql': 'GraphQL',
    'react-native': 'React Native',
    'design-system': 'Design System',
    'prompt-engineering': 'Prompt Engineering',
    'mongodb': 'MongoDB',
    'linux': 'Linux',
    'kubernetes': 'Kubernetes',
    'docker': 'Docker',
    'aws': 'AWS',
    'terraform': 'Terraform',
    'data-structures-algorithms': 'Data Structures & Algorithms',
    'redis': 'Redis',
    'git-github': 'Git and GitHub',
    'php': 'PHP',
    'cloudflare': 'Cloudflare',
    'ai-red-teaming': 'AI Red Teaming',
    'ai-agents': 'AI Agents',
    'nextjs': 'Next.js',
    'code-review': 'Code Review',
    'kotlin': 'Kotlin',
    'html': 'HTML',
    'css': 'CSS',
    'swift': 'Swift & Swift UI',
    'shell': 'Shell / Bash',
    'laravel': 'Laravel',
    'elasticsearch': 'Elasticsearch',
    'wordpress': 'WordPress',
    'django': 'Django',
    'ruby': 'Ruby',
    'ruby-on-rails': 'Ruby on Rails',
    'claude-code': 'Claude Code',
    'vibe-coding': 'Vibe Coding',
    'scala': 'Scala'
};

export function formatPathTitle(title: string): string {
    const key = title.toLowerCase().trim();
    if (TITLE_DICTIONARY[key]) {
        return TITLE_DICTIONARY[key];
    }
    // Fallback: capitalize each word and replace hyphens
    return title
        .replace(/-/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}
