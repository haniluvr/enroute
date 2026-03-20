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
