/**
 * Path module types - structured for Supabase integration.
 * Swap pathMockData for Supabase queries when ready.
 */

export interface PathCard {
    id: string;
    title: string;
    description: string;
    icon: string; // Lucide icon name or asset path
    lastUpdated: string;
    rating?: number;
    reviewCount?: number;
    avatarUrls?: string[];
}

export interface ResourceItem {
    id: string;
    name: string;
    url?: string;
    fileSize?: string;
    duration?: number; // minutes
}

export interface Review {
    id: string;
    authorName: string;
    avatarUrl?: string;
    rating: number;
    text: string;
}

export interface CareerDetails extends PathCard {
    learnItems: string[];
    jobDemand: string;
    avgSalary: string;
    estTimeToComplete: string;
    pdfs: ResourceItem[];
    videos: ResourceItem[];
    articles: ResourceItem[];
    reviews: Review[];
}
