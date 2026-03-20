import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export const ROLE_ROADMAPS = [
    'frontend', 'backend', 'full-stack', 'devops', 'ux-design', 
    'ai-engineer', 'data-analyst', 'software-architect', 'product-manager'
];

export const SKILL_ROADMAPS = [
    'react', 'python', 'sql', 'javascript', 'docker', 'kubernetes', 
    'aws', 'computer-science', 'api-design', 'data-structures-algorithms'
];

export interface JobStats {
    avgSalary: string;
    jobDemand: string;
}

export interface LearningResource {
    id: string;
    name: string;
    url: string;
    type: 'video' | 'article' | 'pdf';
    duration?: number;
}

export const externalDataService = {
    /**
     * Fetch job statistics from Adzuna
     */
    async getJobStats(role: string, country = 'us'): Promise<JobStats> {
        try {
            const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&what=${encodeURIComponent(role)}&results_per_page=10`;
            const response = await axios.get(url);
            const data = response.data;

            if (data.results && data.results.length > 0) {
                const salaries = data.results
                    .filter((r: any) => r.salary_min && r.salary_max)
                    .map((r: any) => (r.salary_min + r.salary_max) / 2);
                
                const avg = salaries.length > 0 
                    ? salaries.reduce((a: number, b: number) => a + b, 0) / salaries.length 
                    : 0;
                
                // Estimate demand by total count (simple heuristic)
                const count = data.count || 0;
                let demand = 'Medium';
                if (count > 5000) demand = 'Very High';
                else if (count > 1000) demand = 'High';
                else if (count < 100) demand = 'Low';

                return {
                    avgSalary: avg > 0 ? `$${Math.round(avg).toLocaleString()}` : 'Competitive',
                    jobDemand: demand
                };
            }
            return { avgSalary: 'N/A', jobDemand: 'Unknown' };
        } catch (error) {
            console.error('Adzuna API Error:', error);
            return { avgSalary: 'Market Rate', jobDemand: 'Steady' };
        }
    },

    /**
     * Fetch roadmap from roadmap.sh GitHub
     */
    async getRoadmapModules(role: string): Promise<string[]> {
        try {
            // Mapping common roles to roadmap.sh names
            const roleMap: Record<string, string> = {
                'frontend': 'frontend',
                'backend': 'backend',
                'data-analyst': 'data-analyst',
                'software-engineer': 'computer-science', // Close enough?
                'ui-ux-designer': 'ux-design',
                'devops': 'devops'
            };

            const mappedRole = roleMap[role.toLowerCase().replace(/\s+/g, '-')] || role.toLowerCase();
            const url = `https://raw.githubusercontent.com/kamranahmedse/developer-roadmap/master/src/data/roadmaps/${mappedRole}/${mappedRole}.json`;
            const response = await axios.get(url);
            
            // Extract unique labels from nodes
            const nodes = response.data.nodes || [];
            const labels = nodes
                .map((n: any) => n.data?.label as string)
                .filter((l: string) => l && l.length > 2 && !l.includes('node'))
                .slice(0, 10); // Take top 10 for simplicity

            return [...new Set(labels)] as string[];
        } catch (error) {
            console.error('Roadmap.sh Fetch Error:', error);
            return [];
        }
    },

    /**
     * Fetch videos from YouTube
     */
    async getYoutubeVideos(topic: string): Promise<LearningResource[]> {
        try {
            if (!YOUTUBE_API_KEY) return [];
            
            const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(topic + ' tutorial')}&type=video&maxResults=3&key=${YOUTUBE_API_KEY}`;
            const response = await axios.get(url);
            
            return response.data.items.map((item: any) => ({
                id: item.id.videoId,
                name: item.snippet.title,
                url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                type: 'video'
            }));
        } catch (error) {
            console.error('YouTube API Error:', error);
            return [];
        }
    },

    /**
     * Fetch last updated date from GitHub
     */
    async getGithubLastUpdated(role: string): Promise<string> {
        try {
            const url = `https://api.github.com/repos/kamranahmedse/developer-roadmap/commits?path=src/data/roadmaps/${role}/${role}.json&page=1&per_page=1`;
            const response = await axios.get(url, {
                headers: { 'Accept': 'application/vnd.github.v3+json' }
            });
            if (response.data && response.data.length > 0) {
                const date = response.data[0].commit.committer.date;
                return new Date(date).toLocaleDateString();
            }
            return new Date().toLocaleDateString();
        } catch (error) {
            return new Date().toLocaleDateString();
        }
    },

    /**
     * Map icons to module titles
     */
    mapModuleIcon(title: string): string {
        const lower = title.toLowerCase();
        if (lower.includes('react')) return 'Atom';
        if (lower.includes('sql') || lower.includes('database')) return 'Database';
        if (lower.includes('git')) return 'GitBranch';
        if (lower.includes('css') || lower.includes('style')) return 'Palette';
        if (lower.includes('js') || lower.includes('script')) return 'FileJson';
        if (lower.includes('api') || lower.includes('rest')) return 'Server';
        if (lower.includes('test')) return 'CheckSquare';
        if (lower.includes('deploy') || lower.includes('docker')) return 'Box';
        if (lower.includes('security')) return 'Shield';
        return 'BookOpen';
    }
};
