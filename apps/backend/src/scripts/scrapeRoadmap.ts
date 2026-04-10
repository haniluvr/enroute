import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { externalDataService, ROLE_ROADMAPS, SKILL_ROADMAPS } from '../services/externalDataService';

import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function scrapeRoadmap(role: string) {
    console.log(`\n🚀 [Scraper] Starting deep scrape for: ${role}`);

    try {
        // 1. Detect Type (Skill vs Role)
        const isSkill = SKILL_ROADMAPS.includes(role.toLowerCase());
        const isRole = ROLE_ROADMAPS.includes(role.toLowerCase());
        const pathType = isSkill ? 'skill' : (isRole ? 'role' : 'role'); // default to role
        console.log(`[Scraper] Detected type: ${pathType}`);

        // 2. Fetch Market Stats & Metadata
        const stats = await externalDataService.getJobStats(role);
        const lastUpdated = await externalDataService.getGithubLastUpdated(role);
        
        const short_description = `Professional learning path for ${role.replace(/-/g, ' ')}. Grounded in real market data and industry roadmaps.`;
        const overview = `[SHORT]${short_description}[/SHORT][TYPE]${pathType}[/TYPE][UPDATED]${lastUpdated}[/UPDATED]
Master the path to becoming a ${role}. 
Average Market Salary: ${stats.avgSalary}
Market Demand: ${stats.jobDemand}`;

        // 3. Ensure the path exists in learning_paths
        const { data: pathEntry, error: pathError } = await supabase
            .from('learning_paths')
            .upsert({ 
                title: role,
                type: pathType,
                overview: overview // Store basic overview, we'll append graph later if needed or skip it
            }, { onConflict: 'title' })
            .select()
            .single();

        if (pathError) throw new Error(`Failed to ensure path: ${pathError.message}`);
        const pathId = pathEntry.id;

        // 4. Fetch JSON structure (Nodes & Edges) with fallback
        const { rawNodes, rawEdges, format } = await externalDataService.getRoadmapModules(role);
        console.log(`[Scraper] Found ${rawNodes.length} nodes and ${rawEdges.length} relationships (Format: ${format}).`);

        // Update path with full graph for legacy compatibility if needed
        const roadmapData = { nodes: rawNodes, edges: rawEdges };
        await supabase
            .from('learning_paths')
            .update({ 
                overview: overview + `\n[ROADMAP]${JSON.stringify(roadmapData)}[/ROADMAP]` 
            })
            .eq('id', pathId);

        // 5. Clear existing modules for this path to rebuild hierarchy
        await supabase.from('learning_modules').delete().eq('path_id', pathId);

        const nodeToModuleId: Record<string, string> = {};
        
        // 6. Process each node
        let orderIndex = 0;
        for (const node of rawNodes) {
            const label = (node.data?.label || node.title?.card || node.data?.text || node.label) as string;
            const nodeId = node.id;
            
            // Skip purely structural nodes without meaningful labels
            if (!label || label.length < 2 || label.toLowerCase().includes('node')) continue;

            const slug = externalDataService.slugify(label);
            console.log(`   > Processing: ${label}...`);

            // 7. Fetch/Parse Content (.md)
            const content = await externalDataService.getModuleContent(role, label, nodeId);

            // 8. Upsert into learning_contents (The Source of Truth)
            const { data: learningContent, error: contentError } = await supabase
                .from('learning_contents')
                .upsert({
                    slug: slug,
                    title: content.title || label,
                    description: content.description,
                    resources: content.resources
                }, { onConflict: 'slug' })
                .select()
                .single();

            if (contentError) {
                console.error(`      ! Failed to save content for ${label}:`, contentError.message);
                continue;
            }

            // 9. Create Module Entry (The relational step)
            const { data: moduleEntry, error: moduleError } = await supabase
                .from('learning_modules')
                .insert({
                    path_id: pathId,
                    content_id: learningContent.id,
                    title: label,
                    order_index: orderIndex++,
                })
                .select()
                .single();

            if (moduleError) {
                console.error(`      ! Failed to create module index for ${label}:`, moduleError.message);
                continue;
            }

            nodeToModuleId[nodeId] = moduleEntry.id;
        }

        // 10. Reconstruct Hierarchy (Parent-Child)
        console.log(`[Scraper] Reconstructing relationships...`);
        for (const edge of rawEdges) {
            const parentModuleId = nodeToModuleId[edge.source];
            const childModuleId = nodeToModuleId[edge.target];

            if (parentModuleId && childModuleId) {
                const { error: edgeError } = await supabase
                    .from('learning_modules')
                    .update({ parent_id: parentModuleId })
                    .eq('id', childModuleId);
                
                if (edgeError) {
                    // console.warn(`      ! Failed to link ${edge.source} -> ${edge.target}:`, edgeError.message);
                }
            }
        }

        console.log(`✅ [Scraper] Finished ${role} successfully.`);
    } catch (err: any) {
        console.error(`❌ [Scraper] Critical Error for ${role}:`, err.message);
    }
}

// Run the scraper for a specific role or from CLI arguments
const roleArg = process.argv[2] || 'frontend';
scrapeRoadmap(roleArg).catch(console.error);
