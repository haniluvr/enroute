import { useState, useEffect } from 'react';
import { Briefcase, Search, ExternalLink, RefreshCw, Send, Users } from 'lucide-react';
import { RecommendToUsersModal } from '../components/RecommendToUsersModal';
import { ApplicantViewerModal } from '../components/ApplicantViewerModal';

export const JobBoard = () => {
    const [query, setQuery] = useState('Software Engineer');
    const [region, setRegion] = useState('Philippines');
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cooldown, setCooldown] = useState(false);
    
    const [recommendationJob, setRecommendationJob] = useState<any | null>(null);
    const [viewApplicantJob, setViewApplicantJob] = useState<any | null>(null);

    const searchJobs = async () => {
        if (!query.trim() || cooldown) return;
        
        setLoading(true);
        setError(null);
        
        setCooldown(true);
        setTimeout(() => setCooldown(false), 5000);

        const apiKey = import.meta.env.VITE_RAPIDAPI_KEY;
        const fullQuery = `${query} in ${region}`;

        if (!apiKey) {
            setError("JSearch API Key is missing in .env file (VITE_RAPIDAPI_KEY).");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(fullQuery)}&page=1&num_pages=1`, {
                headers: {
                    'X-RapidAPI-Key': apiKey,
                    'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
                }
            });

            if (res.status === 429) throw new Error("JSearch API limit reached. Please update your RapidAPI key in .env.");
            if (res.status === 403) throw new Error("Invalid JSearch API key. Please check VITE_RAPIDAPI_KEY in .env.");
            if (!res.ok) throw new Error(`JSearch API Error: ${res.statusText}`);

            const data = await res.json();
            setJobs(data.data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        searchJobs();
    }, []);

    return (
        <div className="space-y-6 max-w-6xl pb-16">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
                        <Briefcase className="w-8 h-8 text-blue-500" />
                        Agency Job Board
                    </h1>
                    <p className="text-gray-400">Source live positions via JSearch to explicitly recommend to your talent pool.</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                        type="text" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="e.g. React Developer"
                        className="w-full bg-[#161a29] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors shadow-inner"
                        onKeyDown={(e) => e.key === 'Enter' && searchJobs()}
                    />
                </div>
                
                <select 
                    value={region} 
                    onChange={e => setRegion(e.target.value)}
                    className="bg-[#161a29] border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer font-semibold min-w-[180px]"
                >
                    <option className="text-gray-900" value="Philippines">🇵🇭 Philippines</option>
                    <option className="text-gray-900" value="Singapore">🇸🇬 Singapore</option>
                    <option className="text-gray-900" value="United States">🇺🇸 United States</option>
                    <option className="text-gray-900" value="Remote">🌐 Remote (Global)</option>
                </select>

                <button 
                    onClick={searchJobs}
                    disabled={loading || cooldown}
                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 whitespace-nowrap"
                >
                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                    {cooldown && !loading ? 'Cooldown (5s)' : 'Search Jobs'}
                </button>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {jobs.map((job, idx) => (
                    <div key={job.job_id || idx} className="bg-[#111524] border border-white/5 rounded-2xl p-6 flex flex-col transition-all hover:-translate-y-1 hover:border-white/20 hover:shadow-xl relative overflow-hidden group">
                        
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div>
                                <h3 className="text-lg font-bold text-white line-clamp-2">{job.job_title}</h3>
                                <p className="text-blue-400 text-sm font-medium mt-1">{job.employer_name}</p>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-4 relative z-10">
                           {job.job_is_remote ? (
                               <span className="px-2 py-1 bg-green-500/10 text-green-400 text-[10px] font-bold uppercase rounded-md border border-green-500/20">Remote</span>
                           ) : null}
                           <span className="px-2 py-1 bg-white/5 text-gray-300 text-[10px] font-bold uppercase rounded-md border border-white/10">
                               {job.job_city}, {job.job_state}
                           </span>
                        </div>

                        <p className="text-gray-400 text-sm line-clamp-3 mb-6 flex-1 relative z-10">
                            {job.job_description || "No description provided."}
                        </p>

                        <div className="flex flex-col gap-2 pt-4 border-t border-white/5 mt-auto relative z-10">
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setRecommendationJob(job)}
                                    className="flex-1 text-center py-2.5 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600 hover:border-blue-500 hover:text-white transition-all text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <Send size={14} /> Recommend to users
                                </button>
                                <a 
                                    href={job.job_apply_link} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="px-4 py-2.5 rounded-xl bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center shadow-sm"
                                    title="View details"
                                >
                                    <ExternalLink size={16} />
                                </a>
                            </div>
                            <button 
                                onClick={() => setViewApplicantJob(job)}
                                className="w-full text-center py-2.5 rounded-xl bg-violet-600/10 text-violet-400 border border-violet-500/20 hover:bg-violet-600 hover:border-violet-500 hover:text-white transition-all text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm mt-1"
                            >
                                <Users size={14} /> View Applicants
                            </button>
                        </div>
                        <div className="absolute -right-16 -bottom-16 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
                    </div>
                 ))}
            </div>

            {!loading && jobs.length === 0 && (
                <div className="text-center py-20 border border-white/5 rounded-2xl bg-[#111524]">
                    <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-300">No jobs found</h3>
                    <p className="text-gray-600 mt-2">Try adjusting your JSearch query.</p>
                </div>
            )}
            
            <RecommendToUsersModal 
                isOpen={!!recommendationJob} 
                onClose={() => setRecommendationJob(null)}
                jobTitle={recommendationJob?.job_title || ''}
                employer={recommendationJob?.employer_name || ''}
                jobLink={recommendationJob?.job_apply_link || ''}
            />

            <ApplicantViewerModal 
                isOpen={!!viewApplicantJob}
                onClose={() => setViewApplicantJob(null)}
                jobTitle={viewApplicantJob?.job_title || ''}
                employer={viewApplicantJob?.employer_name || ''}
            />
        </div>
    );
};

