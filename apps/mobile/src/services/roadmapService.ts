import { TITLE_DICTIONARY } from '@/utils/pathUtils';

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/kamranahmedse/developer-roadmap/master/src/data/roadmaps';

export interface RoadmapTopicContent {
    title: string;
    description: string;
    resources: {
        type: 'video' | 'article' | 'official' | 'course' | 'book';
        title: string;
        url: string;
    }[];
}

/**
 * Service to fetch detailed topic content from the developer-roadmap GitHub repository.
 */
export const RoadmapService = {
    /**
     * Tries to find a slug for the given path title
     */
    getSlugFromTitle(title: string): string | null {
        const lowerTitle = title.toLowerCase().trim();
        
        // Direct match in dictionary keys
        if (TITLE_DICTIONARY[lowerTitle]) return lowerTitle;
        
        // Reverse search in values
        for (const [slug, name] of Object.entries(TITLE_DICTIONARY)) {
            if (name.toLowerCase() === lowerTitle) return slug;
        }
        
        // Basic slugification fallback
        return lowerTitle.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    },

    /**
     * Fetches the content for a specific roadmap topic
     */
    async getTopicContent(roadmapSlug: string, topicId: string, topicLabel: string): Promise<RoadmapTopicContent | null> {
        try {
            // Mapping label to topic name for the URL (e.g. "Internet" -> "internet")
            const topicName = topicLabel.toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '');
            
            // Format: topic-name@id.md
            const fileName = `${topicName}@${topicId}.md`;
            const url = `${GITHUB_RAW_BASE}/${roadmapSlug}/content/${fileName}`;
            
            console.log(`Fetching topic content from: ${url}`);
            const response = await fetch(url);
            
            if (!response.ok) return null;
            
            const markdown = await response.text();
            return this.parseMarkdownContent(markdown, topicLabel);
        } catch (error) {
            console.warn(`Failed to fetch content for topic ${topicId}:`, error);
            return null;
        }
    },

    /**
     * Parses the markdown content from the repo
     */
    parseMarkdownContent(md: string, fallbackTitle: string): RoadmapTopicContent {
        const lines = md.split('\n');
        let title = fallbackTitle;
        let description = '';
        const resources: RoadmapTopicContent['resources'] = [];
        
        let foundFirstHeader = false;
        let parsingResources = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Extract Title
            if (!foundFirstHeader && line.startsWith('# ')) {
                title = line.replace('# ', '').trim();
                foundFirstHeader = true;
                continue;
            }
            
            // Extract Description (between title and resources)
            if (foundFirstHeader && !parsingResources && line && !line.startsWith('-') && !line.startsWith('*')) {
                description += (description ? '\n' : '') + line;
            }
            
            // Detect Resources start
            if (line.toLowerCase().includes('resources') || line.startsWith('- [') || line.startsWith('* [')) {
                parsingResources = true;
            }
            
            // Parse Resource Links
            if (parsingResources && (line.startsWith('- ') || line.startsWith('* '))) {
                const linkMatch = line.match(/\[(.*?)\]\((.*?)\)/);
                if (linkMatch) {
                    const resTitle = linkMatch[1];
                    const url = linkMatch[2];
                    
                    // Determine type from icons in text
                    let type: RoadmapTopicContent['resources'][0]['type'] = 'article';
                    if (line.includes('@video@')) type = 'video';
                    else if (line.includes('@official@')) type = 'official';
                    else if (line.includes('@course@')) type = 'course';
                    else if (line.includes('@book@')) type = 'book';
                    
                    resources.push({
                        title: resTitle.replace(/@\w+@/g, '').trim(),
                        url,
                        type
                    });
                }
            }
        }
        
        // Clean up description
        description = description.replace(/<[^>]*>?/gm, '').trim(); // Remove HTML comments/tags
        
        return { title, description, resources };
    }
};
