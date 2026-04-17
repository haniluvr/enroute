import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export const ROLE_ROADMAPS = [
    'frontend', 'backend', 'full-stack', 'devops', 'devsecops', 'data-analyst', 
    'ai-engineer', 'ai-data-scientist', 'data-engineer', 'android', 'machine-learning', 
    'postgresql-dba', 'ios', 'blockchain', 'qa', 'software-architect', 
    'cyber-security', 'ux-design', 'technical-writer', 'game-developer', 
    'server-side-game-developer', 'mlops', 'product-manager', 'engineering-manager', 
    'developer-relations', 'bi-analyst'
];

export const SKILL_ROADMAPS = [
    'sql', 'computer-science', 'react', 'vue', 'angular', 'javascript', 'typescript', 
    'nodejs', 'python', 'system-design', 'java', 'aspnet-core', 'api-design', 
    'spring-boot', 'flutter', 'cpp', 'rust', 'golang', 'software-design-architecture', 
    'graphql', 'react-native', 'design-system', 'prompt-engineering', 'mongodb', 
    'linux', 'kubernetes', 'docker', 'aws', 'terraform', 'data-structures-algorithms', 
    'redis', 'git-github', 'php', 'cloudflare', 'ai-red-teaming', 'ai-agents', 
    'nextjs', 'code-review', 'kotlin', 'html', 'css', 'swift', 'shell', 'laravel', 
    'elasticsearch', 'wordpress', 'django', 'ruby', 'ruby-on-rails', 'claude-code', 
    'vibe-coding', 'scala'
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
        // Supported countries as of current Adzuna docs
        const ADZUNA_SUPPORTED = ['gb', 'us', 'at', 'au', 'be', 'br', 'ca', 'ch', 'cl', 'cz', 'de', 'es', 'fr', 'ie', 'in', 'it', 'mx', 'nl', 'nz', 'pl', 'ro', 'ru', 'sa', 'sg', 'tr', 'ua', 'za'];
        
        if (!ADZUNA_SUPPORTED.includes(country)) {
            console.log(`[Stats] Country ${country} not supported by Adzuna, skipping Adzuna fetch.`);
            return { avgSalary: 'Market Rate', jobDemand: 'Steady' };
        }

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
                
                // Estimate demand
                const count = data.count || 0;
                let demand = 'Medium';
                if (count > 5000) demand = 'Very High';
                else if (count > 1000) demand = 'High';
                else if (count < 100) demand = 'Low';

                const currency = country === 'ph' ? '₱' : '$';
                return {
                    avgSalary: avg > 0 ? `${currency}${Math.round(avg).toLocaleString()}` : 'Competitive',
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
     * Resolve country code for Adzuna stats
     */
    resolveCountryCode(location?: string): string {
        if (!location) return 'us';
        const loc = location.toLowerCase();
        if (loc.includes('philippines') || loc.includes('manila') || loc.includes('quezon city')) return 'ph';
        if (loc.includes('united kingdom') || loc.includes('uk')) return 'gb';
        if (loc.includes('canada') || loc.includes('ca')) return 'ca';
        if (loc.includes('australia') || loc.includes('au')) return 'au';
        return 'us'; // default
    },

    /**
     * Fetch roadmap from roadmap.sh GitHub with a fallback to the official site's API
     */
    async getRoadmapModules(role: string): Promise<{ labels: string[], rawNodes: any[], rawEdges: any[], format: 'github' | 'site' }> {
        const mappedRole = role.toLowerCase();
        
        try {
            // Attempt 1: GitHub (Preferred, matching hierarchy format)
            const githubUrl = `https://raw.githubusercontent.com/kamranahmedse/developer-roadmap/master/src/data/roadmaps/${mappedRole}/${mappedRole}.json`;
            const response = await axios.get(githubUrl);
            
            const nodes = response.data.nodes || [];
            const edges = response.data.edges || [];
            
            const labelsMap = nodes
                .map((n: any) => n.data?.label as string)
                .filter((l: string) => l && l.length > 2 && !l.includes('node'));

            return {
                labels: [...new Set(labelsMap)] as string[],
                rawNodes: nodes,
                rawEdges: edges,
                format: 'github'
            };
        } catch (error: any) {
            // Attempt 2: Fallback to roadmap.sh official site JSON
            console.log(`[Roadmap] GitHub 404 for ${mappedRole}, trying roadmap.sh fallback...`);
            try {
                const siteUrl = `https://roadmap.sh/${mappedRole}.json`;
                const response = await axios.get(siteUrl);
                
                // Site format is flat nodes/edges
                const nodes = response.data.nodes || [];
                const edges = response.data.edges || [];
                
                const labelsMap = nodes
                    .map((n: any) => (n.data?.label || n.title?.card) as string)
                    .filter((l: string) => l && l.length > 1);

                return {
                    labels: [...new Set(labelsMap)] as string[],
                    rawNodes: nodes,
                    rawEdges: edges,
                    format: 'site'
                };
            } catch (fallbackError: any) {
                console.error('Roadmap Fetch All-Attempts Error:', fallbackError.message);
                return { labels: [], rawNodes: [], rawEdges: [], format: 'github' };
            }
        }
    },

    /**
     * Fetch and parse a specific module's markdown content
     */
    async getModuleContent(role: string, label: string, nodeId: string): Promise<{ title: string, description: string, resources: any[] }> {
        const slug = this.slugify(label);
        
        // Potential paths to check on GitHub (different structures for different roadmaps)
        const possibleUrls = [
            `https://raw.githubusercontent.com/kamranahmedse/developer-roadmap/master/src/data/roadmaps/${role}/content/${slug}@${nodeId}.md`,
            `https://raw.githubusercontent.com/kamranahmedse/developer-roadmap/master/src/data/roadmaps/${role}/content/${slug}.md`,
            `https://raw.githubusercontent.com/kamranahmedse/developer-roadmap/master/src/data/roadmaps/${role}/content/${slug}@.md`,
            // Some, like CSS, are actually nested differently in the repo but usually accessible via the roadmap folder
            `https://raw.githubusercontent.com/kamranahmedse/developer-roadmap/master/src/data/roadmaps/${role}/${slug}.md`
        ];

        for (const url of possibleUrls) {
            try {
                console.log(`[Content] Trying: ${url}`);
                const response = await axios.get(url, { timeout: 5000 });
                if (response.status === 200) {
                    return this.parseModuleMarkdown(response.data);
                }
            } catch (ignore) {
                // Keep trying next URL
            }
        }

        console.warn(`[Content] Exhausted all content paths for ${label} (${nodeId})`);
        return { title: label, description: '', resources: [] };
    },

    /**
     * Parse roadmap.sh markdown to extract categorized resources
     */
    parseModuleMarkdown(md: string): { title: string, description: string, resources: any[] } {
        // Extraction regex for resources: [@tag@Label](URL)
        const resourceRegex = /\[@(video|article|official|course|roadmap|feed)@(.*?)\]\((.*?)\)/g;
        const resources: any[] = [];
        let match;
        
        while ((match = resourceRegex.exec(md)) !== null) {
            resources.push({
                type: match[1],
                label: match[2],
                url: match[3]
            });
        }
        
        // Extract title (usually the first # header)
        const titleMatch = md.match(/^# (.*)$/m);
        const title = titleMatch ? titleMatch[1].trim() : 'Resources';
        
        // Extract description (everything after title but before resources/first divider)
        let description = md
            .replace(/^# .*$/m, '') // Remove title
            .replace(resourceRegex, '') // Remove resource links
            .replace(/\n\s*\n/g, '\n') // Consolidate newlines
            .trim();
            
        // We might want to keep some structure, but for now we take the first few paragraphs
        const lines = description.split('\n');
        if (lines.length > 10) {
            description = lines.slice(0, 10).join('\n') + '...';
        }

        return { title, description, resources };
    },

    /**
     * Simple slugify helper
     */
    slugify(text: string): string {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')     // Replace spaces with -
            .replace(/[^\w-]+/g, '')  // Remove all non-word chars
            .replace(/--+/g, '-');    // Replace multiple - with single -
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
     * AI-based salary estimation fallback
     */
    async estimateSalaryAI(role: string, location: string): Promise<string> {
        try {
            const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
            if (!HF_API_KEY) return 'Competitive';

            console.log(`[AI] Estimating salary for: ${role} in ${location}`);
            const prompt = `Role: ${role}\nLocation: ${location}\n\nEstimate the current average monthly salary for this role in this location (localized). 
            Use the local currency symbol (e.g. ₱ for Philippines, $ for US).
            Provide ONLY the estimated salary range (e.g. "₱45,000 - ₱65,000" or "$3,500 - $5,000"). No explanation. Output ONLY the range.`;

            const response = await axios.post('https://router.huggingface.co/v1/chat/completions', {
                model: "meta-llama/Llama-3.1-8B-Instruct",
                messages: [
                    { role: 'system', content: 'You are a career salary expert. Output ONLY the estimated salary range in local currency.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 50,
                temperature: 0.3,
            }, {
                headers: { 'Authorization': `Bearer ${HF_API_KEY}` }
            });

            return response.data.choices[0].message.content.trim().replace(/^"|"$/g, '');
        } catch (error) {
            console.error('[AI] Salary Estimation Error:', error);
            return 'Competitive';
        }
    },

    /**
     * Bulk AI Summarization for Jobs
     */
    async summarizeJobsBulk(jobs: any[]): Promise<any[]> {
        try {
            const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
            if (!HF_API_KEY || jobs.length === 0) return jobs;

            console.log(`[AI] Bulk summarizing ${jobs.length} jobs...`);
            
            const payload = jobs.map(j => ({
                id: j.id,
                title: j.role_title,
                desc: j.description.substring(0, 500),
                quals: j.required_skills.slice(0, 5)
            }));

            const prompt = `Distill these ${jobs.length} job postings into a professional mobile UI format.
            
            RULES:
            1. summary: A 1-sentence "smart" summary (max 150 chars) of core responsibilities. Focus on WHAT they will do.
            2. skills: Convert qualifications into exactly 1-2 word professional skill names (e.g., "React", "Project Management").
            
            JOBS TO SUMMARIZE (JSON):
            ${JSON.stringify(payload)}
            
            Output ONLY a JSON array of objects with "id", "summary", and "skills". No explanation.`;

            const response = await axios.post('https://router.huggingface.co/v1/chat/completions', {
                model: "meta-llama/Llama-3.1-8B-Instruct",
                messages: [
                    { role: 'system', content: 'You are a professional HR analyst. Summarize jobs concisely for a mobile app.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 2000,
                temperature: 0.2,
            }, {
                headers: { 'Authorization': `Bearer ${HF_API_KEY}` }
            });

            const content = response.data.choices[0].message.content;
            const match = content.match(/\[.*\]/s);
            if (!match) return jobs;

            const summaries = JSON.parse(match[0]);
            
            return jobs.map(j => {
                const s = summaries.find((item: any) => item.id === j.id);
                return {
                    ...j,
                    description: s?.summary || j.description,
                    required_skills: s?.skills || j.required_skills
                };
            });
        } catch (error) {
            console.error('[AI] Bulk Summarization Error:', error);
            return jobs;
        }
    },

    /**
     * Smart Skill Extraction (1-2 word tags from description)
     */
    async extractSkillsAI(jobs: any[]): Promise<any[]> {
        try {
            const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
            if (!HF_API_KEY || jobs.length === 0) return jobs;

            const payload = jobs.map((j, index) => ({
                id: index,
                title: j.role_title,
                desc: j.description.substring(0, 800)
            }));

            const prompt = `Extract exactly 5 technical skills for each job.
            
            OUTPUT FORMAT (JSON):
            [
              {"id": 0, "skills": ["React", "CSS"]},
              {"id": 1, "skills": ["Python", "SQL"]}
            ]
            
            JOBS:
            ${JSON.stringify(payload)}
            
            IMPORTANT: Use EXACT id from input. Output ONLY valid JSON array. No explanation.`;
            
            console.log(`[AI] Extracting skills for ${jobs.length} jobs using index mapping.`);

            const response = await axios.post('https://router.huggingface.co/v1/chat/completions', {
                model: "meta-llama/Llama-3.1-8B-Instruct",
                messages: [
                    { role: 'system', content: 'You are an HR technology assistant. Extract concise skills in JSON.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 1500,
                temperature: 0.1,
            }, {
                headers: { 'Authorization': `Bearer ${HF_API_KEY}` }
            });
            
            const content = response.data.choices[0].message.content;
            const match = content.match(/\[.*\]/s);
            if (!match) return jobs;

            const skillSets = JSON.parse(match[0]);
            
            return jobs.map((j, index) => {
                const s = skillSets.find((item: any) => Number(item.id) === index);
                const aiSkills = s?.skills || [];
                
                // Merge AI skills with current required_skills (which has raw qualifications fallback)
                // Filter out obviously non-skill strings from raw fallback (too long strings)
                const current = j.required_skills.filter((s: string) => s.split(' ').length <= 3); 
                
                const final = [...new Set([...aiSkills, ...current])].slice(0, 6);
                
                return {
                    ...j,
                    required_skills: final.length > 0 ? final : ['Career Growth', 'Team Collaboration', 'Professionalism']
                };
            });
        } catch (error) {
            console.error('[AI] Skill Extraction Error:', error);
            return jobs;
        }
    },

    /**
     * Fetch jobs from JSearch (RapidAPI) with backup fallback
     */
    async searchJobs(query: string, location?: string, employment_types?: string, job_requirements?: string): Promise<any[]> {
        const JSEARCH_API_KEY = process.env.JSEARCH_API_KEY;
        const JSEARCH_API_HOST = process.env.JSEARCH_API_HOST;
        const JSEARCH_BACKUP_KEY = process.env.JSEARCH_BACKUP_KEY;
        const JSEARCH_BACKUP_HOST = process.env.JSEARCH_BACKUP_HOST;

        if (!JSEARCH_API_KEY) {
            console.error('[JSearch] Primary API Key Missing');
            return [];
        }

        const searchQuery = location ? `${query} in ${location}` : query;
        console.log(`[JSearch] Querying: "${searchQuery}"`);

        // Fetch Market stats for meta-data once
        const countryCode = this.resolveCountryCode(location);
        let marketStats = await this.getJobStats(query, countryCode);

        if (marketStats.avgSalary === 'Market Rate' || marketStats.avgSalary === 'N/A') {
            const aiEstimate = await this.estimateSalaryAI(query, location || 'Philippines');
            marketStats.avgSalary = aiEstimate;
        }

        const attemptFetch = async (key: string, host: string, name: string) => {
            console.log(`[JSearch] Attempting fetch with ${name} provider (Host: ${host})...`);
            
            const isNinjaDirect = host.includes('openwebninja');
            // If it's ninja direct, the URL is slightly different
            const baseUrl = isNinjaDirect 
                ? `https://api.openwebninja.com/jsearch/search`
                : `https://jsearch.p.rapidapi.com/search`;

            const headers: Record<string, string> = {};
            if (isNinjaDirect) {
                headers['X-API-KEY'] = key;
            } else {
                headers['x-rapidapi-key'] = key;
                headers['x-rapidapi-host'] = host;
            }

            const hasFilters = employment_types || job_requirements;
            const numResults = '10'; // Increased default volume
            const numPages = hasFilters ? '2' : '1';

            const options = {
                method: 'GET',
                url: baseUrl,
                params: {
                    query: searchQuery,
                    page: '1',
                    num_pages: numPages,
                    employment_types: employment_types,
                    job_requirements: job_requirements,
                },
                headers: headers,
                timeout: 10000 // 10s timeout to avoid hanging
            };

            return await axios.request(options);
        };

        try {
            let response;
            let success = false;

            try {
                // Try Primary
                response = await attemptFetch(JSEARCH_API_KEY, JSEARCH_API_HOST!, 'Primary');
                if (response.data?.data && response.data.data.length > 0) {
                    success = true;
                } else {
                    console.log(`[JSearch] Primary returned no results, trying backup if available...`);
                }
            } catch (error: any) {
                console.warn(`[JSearch] Primary failed (${error.response?.status || error.message})`);
            }

            // If primary failed OR returned NO results, try backup
            if (!success && JSEARCH_BACKUP_KEY && JSEARCH_BACKUP_HOST) {
                try {
                    console.log(`[JSearch] Triggering fallback to Backup...`);
                    response = await attemptFetch(JSEARCH_BACKUP_KEY, JSEARCH_BACKUP_HOST, 'Open Web Ninja (Backup)');
                    if (response.data?.data && response.data.data.length > 0) {
                        success = true;
                    }
                } catch (backupError: any) {
                    console.error(`[JSearch] Backup also failed: ${backupError.message}`);
                }
            }

            if (!success || !response || !response.data) {
                console.warn('[JSearch] No jobs found from any provider.');
                return [];
            }

            // Increase discovery: show up to 10 jobs if available
            const MAX_RESULTS = 10;

            const rawJobs = (response.data.data || []).slice(0, MAX_RESULTS).map((j: any) => {
                let salary = `Est. ${marketStats.avgSalary}`; 
                if (j.job_min_salary) {
                    const currency = j.job_salary_currency || '$';
                    const period = (j.job_salary_period || '').toLowerCase();
                    salary = `${currency}${j.job_min_salary.toLocaleString()}`;
                    if (j.job_max_salary && j.job_max_salary !== j.job_min_salary) {
                        salary += ` - ${currency}${j.job_max_salary.toLocaleString()}`;
                    }
                    if (period === 'month') salary += '/mo';
                    else if (period === 'year') salary += '/yr';
                }

                const getBestDescription = () => {
                    if (j.job_description && j.job_description.length > 50) return j.job_description;
                    const highlights = [
                        ...(j.job_highlights?.Qualifications || []),
                        ...(j.job_highlights?.Responsibilities || []),
                        ...(j.job_highlights?.Benefits || [])
                    ].join('. ');
                    return highlights || j.job_description || 'Explore this opportunity and learn more about the role and company culture.';
                };

                return {
                    id: j.job_id,
                    role_title: j.job_title,
                    company_name: j.employer_name,
                    company_logo: j.employer_logo,
                    location: `${j.job_city || ''} ${j.job_state || ''}`.trim().replace(/^, /, '') || 'Remote / Flexible',
                    description: getBestDescription(),
                    required_skills: (j.job_highlights?.Qualifications || []).slice(0, 5), 
                    salary_range: salary,
                    external_url: j.job_apply_link,
                    full_details: {
                        employment_type: j.job_employment_type?.replace(/_/g, ' ') || 'Full-time',
                        experience: j.job_required_experience?.required_experience_in_months 
                            ? `${Math.floor(j.job_required_experience.required_experience_in_months / 12)} years` 
                            : 'Entry Level',
                        qualifications: j.job_highlights?.Qualifications || j.job_highlights?.qualifications || [],
                        responsibilities: j.job_highlights?.Responsibilities || j.job_highlights?.responsibilities || [],
                        benefits: j.job_highlights?.Benefits || j.job_highlights?.benefits || []
                    }
                };
            });

            return await this.extractSkillsAI(rawJobs);
        } catch (error) {
            console.error('[JSearch] Error processing jobs:', error);
            return [];
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
