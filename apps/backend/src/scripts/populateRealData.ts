import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { externalDataService, ROLE_ROADMAPS, SKILL_ROADMAPS } from '../services/externalDataService';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function populate() {
    console.log('--- ENROUTE ADVANCED DATA POPULATOR STARTING ---');

    const totalPaths = [...ROLE_ROADMAPS.map(r => ({ name: r, type: 'role' })), ...SKILL_ROADMAPS.map(s => ({ name: s, type: 'skill' }))];

    for (const item of totalPaths) {
        const role = item.name;
        const type = item.type;
        console.log(`\nProcessing ${type}: ${role}...`);

        try {
            // 1. Fetch Stats
            const stats = await externalDataService.getJobStats(role);
            const lastUpdated = await externalDataService.getGithubLastUpdated(role);
            
            // 2. Map Icon for Path
            let pathIcon = 'DraftingCompass';
            if (type === 'role') pathIcon = 'Briefcase';
            if (role === 'frontend' || role === 'react') pathIcon = 'Atom';
            if (role === 'backend' || role === 'python') pathIcon = 'Server';

            // 3. Short description
            const short_description = `Professional learning path for ${role.replace(/-/g, ' ')}. Grounded in real market data and industry roadmaps.`;
            
            const overview = `[SHORT]${short_description}[/SHORT][TYPE]${type}[/TYPE][ICON]${pathIcon}[/ICON][UPDATED]${lastUpdated}[/UPDATED]
Master the path to becoming a ${role}. 
Average Market Salary: ${stats.avgSalary}
Market Demand: ${stats.jobDemand}`;

            // 4. Fetch Modules
            const moduleTitles = await externalDataService.getRoadmapModules(role) as string[];
            
            // 5. Upsert Path
            const { data: existingPath } = await supabase
                .from('learning_paths')
                .select('id')
                .eq('title', role)
                .maybeSingle();

            let pathId: string;
            const pathPayload: any = {
                title: role,
                overview: overview,
                reviews_avg: (4 + Math.random()).toFixed(1)
            };

            if (existingPath) {
                const { data: updatedPath, error: updateError } = await supabase
                    .from('learning_paths')
                    .update(pathPayload)
                    .eq('id', existingPath.id)
                    .select()
                    .single();
                if (updateError) throw updateError;
                pathId = updatedPath.id as string;
            } else {
                const { data: newPath, error: insertError } = await supabase
                    .from('learning_paths')
                    .insert(pathPayload)
                    .select()
                    .single();
                if (insertError) throw insertError;
                pathId = newPath.id as string;
            }

            console.log(`   - Saved Path: ${role} as ${type}`);

            // 6. Save Modules
            if (moduleTitles.length > 0) {
                await supabase.from('learning_modules').delete().eq('path_id', pathId);

                for (const mTitle of moduleTitles) {
                    const videos = await externalDataService.getYoutubeVideos(mTitle);
                    const videoUrl = videos.length > 0 ? videos[0].url : `https://www.youtube.com/results?search_query=${encodeURIComponent(mTitle)}`;
                    const modIcon = externalDataService.mapModuleIcon(mTitle);

                    await supabase
                        .from('learning_modules')
                        .insert({
                            path_id: pathId,
                            title: `[${modIcon}] ${mTitle}`,
                            content_type: 'video',
                            content_url: videoUrl
                        });
                }
                console.log(`   - Added ${moduleTitles.length} modules with icons.`);
            }
        } catch (err: any) {
            console.error(`Error processing role ${role}:`, err.message);
        }
    }

    console.log('\n--- ADVANCED POPULATION COMPLETE ---');
}

populate().catch(console.error);
