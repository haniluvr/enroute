import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { ArrowLeft, Route, Activity, MessageCircle, Target, Briefcase, Send, X, Calendar, BookOpen, PlayCircle, ChevronRight, Link as LinkIcon } from 'lucide-react';
import { SlideOver } from '../components/SlideOver';
import { ChatViewer } from '../components/ChatViewer';
import { VideoModal } from '../components/VideoModal';

export const UserProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [roadmaps, setRoadmaps] = useState<any[]>([]);
    const [roadmapSteps, setRoadmapSteps] = useState<any[]>([]);
    const [conversations, setConversations] = useState<any[]>([]);
    const [cv, setCv] = useState<any>(null);
    const [completions, setCompletions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [showRecModal, setShowRecModal] = useState(false);
    const [recJobTitle, setRecJobTitle] = useState('');
    const [recEmployer, setRecEmployer] = useState('');
    const [recLink, setRecLink] = useState('');
    const [isPushing, setIsPushing] = useState(false);
    const [playingUrl, setPlayingUrl] = useState<string | null>(null);

    const [selectedPath, setSelectedPath] = useState<any>(null);
    const [isPathViewerOpen, setIsPathViewerOpen] = useState(false);
    const [selectedChat, setSelectedChat] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!id) return;
            try {
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', id).single();
                setUser(profile);

                const { data: userRoadmaps } = await supabase.from('roadmaps').select('*').eq('user_id', id).order('created_at', { ascending: false });
                setRoadmaps(userRoadmaps || []);
                
                if (userRoadmaps && userRoadmaps.length > 0) {
                    const rIds = userRoadmaps.map((r: any) => r.id);
                    const { data: steps } = await supabase.from('roadmap_steps').select('*, roadmaps(target_role)').in('roadmap_id', rIds).order('order', { ascending: true }).limit(20);
                    setRoadmapSteps(steps || []);
                }

                const { data: convos } = await supabase.from('conversations').select('*').eq('user_id', id).order('created_at', { ascending: false });
                setConversations(convos || []);
                
                const { data: cvScans } = await supabase.from('cv_scans').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(1);
                setCv(cvScans?.[0] || null);

                const { data: userCompletions } = await supabase.from('user_module_completions').select('*').eq('user_id', id);
                setCompletions(userCompletions || []);

            } catch (err) {
                console.error("Failed to load user details", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [id]);

    const handleShortlist = async (rmap: any) => {
        const role = rmap.target_role?.replace('⭐ Job Match: ', '') || '';
        if (!confirm(`Are you sure you want to shortlist this user for ${role}?`)) return;
        
        try {
            const { error } = await supabase.from('roadmaps').insert({
                user_id: id,
                target_role: `⭐ Shortlist: ${role}`,
                goal: 'Manual recruitment shortlist for agency opportunities.',
                current_level: 'entry',
                estimated_time: 'Shortlisted',
                is_completed: false
            });
            if (error) throw error;
            alert(`User successfully added to ${role} shortlist!`);
        } catch (err: any) {
            alert(`Shortlist failed: ${err.message}`);
        }
    };

    const handlePushRecommendation = async () => {
        if (!recJobTitle || !recEmployer || !recLink) return alert("Title, Employer, and Application Link are all required.");
        setIsPushing(true);
        try {
            const { error } = await supabase.from('roadmaps').insert({
                user_id: id,
                target_role: `⭐ Job Match: ${recJobTitle}`,
                goal: `Agency Hand-Picked Recommendation for ${recEmployer}. \nApply here: ${recLink}`,
                current_level: 'entry',
                estimated_time: '1 week',
                is_completed: false
            });
            
            if (error) throw error;
            
            alert("Recommendation successfully pushed to the user's mobile app!");
            setShowRecModal(false);
            setRecJobTitle(''); setRecEmployer(''); setRecLink('');
            
            const { data: userRoadmaps } = await supabase.from('roadmaps').select('*').eq('user_id', id).order('created_at', { ascending: false });
            setRoadmaps(userRoadmaps || []);
        } catch (err: any) {
            alert(`Failed: ${err.message}`);
        } finally {
            setIsPushing(false);
        }
    };

    if (loading) return <div className="p-8 text-gray-400">Loading user data...</div>;
    if (!user) return <div className="p-8 text-red-400">User Record not found</div>;

    const completionRate = roadmapSteps.length > 0 ? (completions.length / roadmapSteps.length) * 100 : 0;
    const skillRating = Math.min(Math.round(completionRate + (cv ? 15 : 0) + (conversations.length * 2) + 5), 100);

    return (
        <div className="max-w-7xl space-y-6 pb-20 relative">
            <button onClick={() => navigate('/dashboard/users')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4">
                <ArrowLeft size={16} /> Back to Users
            </button>

            <div className="bg-[#161a29] border border-white/10 rounded-3xl p-8 relative overflow-hidden flex items-start justify-between">
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl"></div>
                
                <div className="flex items-center gap-6 relative z-10 w-full">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-violet-500 flex items-center justify-center text-3xl font-bold border-4 border-[#0a0f1c]">
                        {user.first_name?.[0] || user.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-black">{user.first_name} {user.last_name}</h1>
                                <p className="text-gray-400 mt-1">{user.email}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                {cv && (
                                    <button onClick={() => window.open(cv.file_url, '_blank')} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/20 text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-all">
                                        <BookOpen size={16} /> View CV
                                    </button>
                                )}
                                <div className="text-right border-l border-white/10 pl-6">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Recruit Readiness</p>
                                    <div className="flex items-end justify-end gap-1 text-emerald-400">
                                        <span className="text-4xl font-black">{skillRating}</span>
                                        <span className="text-lg font-bold pb-1">%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3 mt-4">
                            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-semibold uppercase tracking-wider text-gray-300">
                                {user.persona || 'Neutral'} Persona
                            </span>
                            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-1">
                                <Target size={12} className="text-fuchsia-400" /> Goal: {user.career_interest || 'Not Set'}
                            </span>
                            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-1">
                                <Activity size={12} className="text-blue-400" /> Since {new Date(user.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="col-span-1 space-y-4">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="font-bold flex items-center gap-2 text-white"><MessageCircle size={18} className="text-emerald-400" /> AI Sessions</h3>
                        <span className="text-xs font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{conversations.length} total</span>
                    </div>
                    {conversations.length > 0 ? conversations.map((convo, idx) => (
                        <div key={convo.id} className="bg-[#161a29] border border-white/10 hover:border-white/20 hover:bg-white/5 transition-colors rounded-2xl p-4 cursor-pointer" onClick={() => setSelectedChat(convo.id)}>
                            <p className="text-sm font-bold text-white mb-1">Session {idx + 1} <span className="text-xs text-gray-500 font-normal float-right">{new Date(convo.created_at).toLocaleDateString()}</span></p>
                            <p className="text-xs text-gray-400 truncate font-mono">{convo.id}</p>
                            <button className="mt-3 text-xs font-bold text-emerald-400">View Full Transcript →</button>
                        </div>
                    )) : (
                        <div className="p-8 text-center bg-[#161a29] border border-white/10 rounded-2xl">
                            <p className="text-gray-500 text-sm">No recorded coaching sessions.</p>
                        </div>
                    )}
                </div>

                <div className="col-span-1 space-y-4">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="font-bold flex items-center gap-2 text-white"><Route size={18} className="text-blue-400" /> Learning Paths</h3>
                        <span className="text-xs font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{roadmaps.filter(r => !r.target_role?.includes('⭐')).length} total</span>
                    </div>
                    {roadmaps.filter(r => !r.target_role?.includes('⭐')).length > 0 ? roadmaps.filter(r => !r.target_role?.includes('⭐')).map(rmap => (
                        <div key={rmap.id} className="bg-[#161a29] border border-white/10 hover:border-white/20 hover:bg-white/5 rounded-2xl p-5 cursor-pointer transition-all" onClick={() => { setSelectedPath(rmap); setIsPathViewerOpen(true); }}>
                            <div className="flex justify-between items-start mb-3">
                                <div className="w-10 h-10 rounded-xl items-center justify-center bg-white/5 flex">
                                    <Route size={20} className="text-blue-400" />
                                </div>
                                <ChevronRight size={18} className="text-gray-600" />
                            </div>
                            <h4 className="text-white font-bold text-sm mb-1 line-clamp-1">{rmap.target_role || 'General Setup'}</h4>
                            <p className="text-gray-500 text-xs mb-3 line-clamp-2">{rmap.goal || 'Custom learning journey'}</p>
                            <div className="flex items-center gap-2 text-[10px] text-gray-600 font-mono">
                                <Calendar size={10} /> {new Date(rmap.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    )) : (
                        <div className="p-8 text-center bg-[#161a29] border border-white/10 rounded-2xl">
                            <p className="text-gray-500 text-sm">No paths generated.</p>
                        </div>
                    )}
                </div>

                <div className="col-span-1 space-y-4">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="font-bold flex items-center gap-2 text-white"><Target size={18} className="text-fuchsia-400" /> Job Recommendations</h3>
                        <span className="text-xs font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{roadmaps.filter(r => r.target_role?.includes('⭐ Job Match:')).length} sent</span>
                    </div>
                    {roadmaps.filter(r => r.target_role?.includes('⭐ Job Match:')).length > 0 ? roadmaps.filter(r => r.target_role?.includes('⭐ Job Match:')).map(rmap => (
                        <div key={rmap.id} className="bg-blue-600/10 border border-blue-500/20 hover:border-blue-500/40 rounded-2xl p-5 cursor-pointer transition-all shadow-lg shadow-blue-500/5" onClick={() => { setSelectedPath(rmap); setIsPathViewerOpen(true); }}>
                            <div className="flex justify-between items-start mb-3">
                                <div className="w-10 h-10 rounded-xl items-center justify-center bg-blue-500/20 flex">
                                    <Briefcase size={20} className="text-blue-400" />
                                </div>
                                <ChevronRight size={18} className="text-blue-400/50" />
                            </div>
                            <h4 className="text-white font-bold text-sm mb-1 line-clamp-1">{rmap.target_role?.replace('⭐ Job Match: ', '')}</h4>
                            <p className="text-blue-200/60 text-xs mb-3 line-clamp-2">{rmap.goal || 'Recommended by Agency'}</p>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-[10px] text-blue-400/50 font-mono uppercase tracking-tighter">
                                    <Activity size={10} /> Endorsed {new Date(rmap.created_at).toLocaleDateString()}
                                </div>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleShortlist(rmap);
                                    }}
                                    className="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold rounded-lg uppercase tracking-widest transition-colors"
                                >
                                    Shortlist
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="p-8 text-center bg-[#161a29] border border-white/10 rounded-2xl">
                            <p className="text-gray-500 text-sm">No recommendations yet.</p>
                        </div>
                    )}
                </div>

                <div className="col-span-1 space-y-4">
                     <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="font-bold flex items-center gap-2 text-white"><BookOpen size={18} className="text-violet-400" /> Learning Modules</h3>
                        <span className="text-xs font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{roadmapSteps.length} active</span>
                    </div>
                    {roadmapSteps.length > 0 ? roadmapSteps.map(step => (
                        <div key={step.id} className="bg-white/10 border-t border-white/20 rounded-2xl p-5 backdrop-blur-md mb-4 transition-all shadow-xl shadow-black/20 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-2 opacity-30 group-hover:opacity-50 transition-opacity cursor-pointer z-20" onClick={() => setPlayingUrl(step.content_url || step.url)}>
                               <PlayCircle size={60} className="text-violet-500 hover:text-white transition-colors" />
                           </div>
                           
                           <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400 mb-1.5 block truncate w-[80%]">
                               Path: {step.roadmaps?.target_role || "Core Module"}
                           </span>
                           
                           <h4 className="font-bold text-base text-white mb-2 line-clamp-1 pr-6 relative z-10">{step.title}</h4>
                           
                           {(step.content_url || step.url) && (
                               <a href={step.content_url || step.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium mb-3 relative z-10 truncate max-w-[85%]">
                                   <LinkIcon size={12} /> <span className="underline truncate">{(step.content_url || step.url).replace(/^https?:\/\//, '')}</span>
                               </a>
                           )}
                           
                           <div className="flex items-center gap-2 pt-3 relative z-10">
                               {step.educational_platform && (
                                   <span className="px-2.5 py-1.5 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[10px] rounded-lg uppercase font-bold tracking-wider float-left">
                                       {step.educational_platform}
                                   </span>
                               )}
                               {step.is_completed && <span className="px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] rounded-lg uppercase font-bold tracking-wider">Completed</span>}
                           </div>
                        </div>
                    )) : (
                        <div className="p-8 text-center bg-white/5 backdrop-blur-md border hover:bg-white/10 transition-colors border-white/10 rounded-2xl">
                            <p className="text-gray-500 text-sm">No specific learning modules linked.</p>
                        </div>
                    )}
                </div>
            </div>

            {showRecModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowRecModal(false)}>
                    <div className="bg-[#161a29] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-[#111524]">
                            <h3 className="font-bold text-lg text-white">Recommend Job Position</h3>
                            <button onClick={() => setShowRecModal(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-400 mb-2">Push a direct job opportunity into {user.first_name}'s mobile application active paths.</p>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Job Title</label>
                                <input value={recJobTitle} onChange={e => setRecJobTitle(e.target.value)} type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500 transition-colors" placeholder="" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Employer / Company Name</label>
                                <input value={recEmployer} onChange={e => setRecEmployer(e.target.value)} type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500 transition-colors" placeholder="" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Application Link</label>
                                <input value={recLink} onChange={e => setRecLink(e.target.value)} type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500 transition-colors" placeholder="https://..." />
                            </div>
                            
                            <button onClick={handlePushRecommendation} disabled={isPushing} className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-colors">
                                {isPushing ? <Activity className="animate-spin w-5 h-5"/> : <Send className="w-5 h-5" />}
                                Push to Mobile Device
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <SlideOver
                isOpen={!!selectedChat}
                onClose={() => setSelectedChat(null)}
                title="Coaching Transcript"
            >
                {selectedChat && (
                    <div className="h-[calc(100vh-120px)]">
                        <ChatViewer conversationId={selectedChat} />
                    </div>
                )}
            </SlideOver>

            <SlideOver 
                isOpen={isPathViewerOpen} 
                onClose={() => { setIsPathViewerOpen(false); setSelectedPath(null); }}
                title="Learning Path Details"
            >
                {selectedPath && (
                    <div className="space-y-6">
                        <div className={`p-6 rounded-2xl border ${selectedPath.target_role?.includes('⭐ Job Match') ? 'bg-blue-600/10 border-blue-500/20' : 'bg-white/5 border-white/10'}`}>
                            <h2 className="text-2xl font-black text-white mb-2">{selectedPath.target_role}</h2>
                            <p className="text-gray-400 text-sm whitespace-pre-wrap leading-relaxed">{selectedPath.goal || 'No goal specified.'}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[#161a29] p-4 rounded-xl border border-white/5">
                                <span className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Created</span>
                                <span className="text-white text-sm font-medium flex items-center gap-2"><Calendar size={14} className="text-gray-400"/> {new Date(selectedPath.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="bg-[#161a29] p-4 rounded-xl border border-white/5">
                                <span className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Status</span>
                                <span className="text-emerald-400 text-sm font-bold bg-emerald-400/10 px-2 py-1 rounded inline-block">Active Path</span>
                            </div>
                        </div>

                        {selectedPath.target_role?.includes('⭐ Job Match') && (
                            <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-2xl">
                                <div className="flex items-center gap-3 mb-2">
                                    <Target className="text-blue-400 shrink-0" />
                                    <h4 className="font-bold text-white text-lg">Agency Endorsed Match</h4>
                                </div>
                                <p className="text-blue-200/70 text-sm">This specific role was securely pushed to {user.first_name}'s mobile device directly from the Agency Dashboard.</p>
                            </div>
                        )}
                        
                        <details className="mt-8 pt-6 border-t border-white/10">
                            <summary className="text-xs font-bold uppercase tracking-widest text-gray-500 cursor-pointer hover:text-white transition-colors">Developer Payload Details</summary>
                            <div className="mt-4 p-4 rounded-xl bg-[#0a0f1c] border border-white/5 overflow-x-auto">
                                <pre className="text-xs text-gray-400 font-mono">
                                    {JSON.stringify(selectedPath, null, 2)}
                                </pre>
                            </div>
                        </details>
                    </div>
                )}
            </SlideOver>

            {playingUrl && (
                <VideoModal url={playingUrl} onClose={() => setPlayingUrl(null)} />
            )}
        </div>
    );
};
