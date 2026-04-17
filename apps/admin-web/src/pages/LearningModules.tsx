import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { BookOpen, Plus, PlayCircle, Edit2, Trash2, X, Save, Link as LinkIcon } from 'lucide-react';
import { VideoModal } from '../components/VideoModal';

export const LearningModules = () => {
    const [modules, setModules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [playingUrl, setPlayingUrl] = useState<string | null>(null);
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        content_url: '',
        duration_minutes: 0,
        platform: '',
        difficulty: 'Beginner'
    });
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        fetchModules();
    }, []);

    const fetchModules = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('learning_modules')
                .select('*')
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            setModules(data || []);
        } catch (err) {
            console.error("Error fetching modules", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                const { error } = await supabase.from('learning_modules').update(formData).eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('learning_modules').insert([formData]);
                if (error) throw error;
            }
            alert("Module saved successfully.");
            setIsFormOpen(false);
            setEditingId(null);
            fetchModules();
        } catch (err: any) {
            alert(`Save failed: ${err.message}`);
        }
    };

    const handleEdit = (mod: any) => {
        setFormData({
            title: mod.title || '',
            description: mod.description || '',
            content_url: mod.content_url || '',
            duration_minutes: mod.duration_minutes || 0,
            platform: mod.platform || '',
            difficulty: mod.difficulty || 'Beginner'
        });
        setEditingId(mod.id);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this learning module?")) return;
        try {
            const { error } = await supabase.from('learning_modules').delete().eq('id', id);
            if (error) throw error;
            fetchModules();
        } catch (err: any) {
            alert(`Delete failed: ${err.message}`);
        }
    };

    return (
        <div className="space-y-6 max-w-6xl pb-16">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
                        <BookOpen className="w-8 h-8 text-violet-500" />
                        Learning Modules
                    </h1>
                    <p className="text-gray-400">Manage the global repository of videos, articles, and interactive lessons.</p>
                </div>
                <button 
                    onClick={() => {
                        setEditingId(null);
                        setFormData({ title: '', description: '', content_url: '', duration_minutes: 0, platform: '', difficulty: 'Beginner' });
                        setIsFormOpen(true);
                    }}
                    className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-violet-500/20 transition-all whitespace-nowrap"
                >
                    <Plus size={18} /> Add Module
                </button>
            </div>

            {loading ? (
                <div className="p-12 text-center text-gray-500">Loading modules...</div>
            ) : modules.length === 0 ? (
                <div className="p-16 text-center bg-[#111524] border border-white/5 rounded-3xl">
                    <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-300">No Learning Modules</h3>
                    <p className="text-gray-600 mt-2 max-w-sm mx-auto">Create educational content to be linked inside user career roadmaps.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modules.map((mod) => (
                        <div key={mod.id} className="bg-[#111524] border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-violet-500/20 transition-colors shadow-lg shadow-black/20">
                            <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity cursor-pointer z-20" onClick={() => setPlayingUrl(mod.content_url)}>
                                <PlayCircle size={80} className="text-violet-500 hover:text-white transition-colors" />
                            </div>

                            <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400 mb-2 block truncate pr-16">
                                {mod.difficulty || 'Beginner'} {mod.platform ? `• ${mod.platform}` : ''}
                            </span>
                            
                            <h3 className="text-lg font-bold text-white mb-1 line-clamp-2 pr-16 relative z-10">{mod.title}</h3>
                            
                            {mod.content_url && (
                                <a href={mod.content_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium mb-3 relative z-10 truncate max-w-[85%]">
                                    <LinkIcon size={12} /> <span className="underline truncate">{mod.content_url.replace(/^https?:\/\//, '')}</span>
                                </a>
                            )}
                            
                            <p className="text-sm text-gray-400 line-clamp-3 mb-6 relative z-10">{mod.description || 'No description'}</p>
                            
                            <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-auto relative z-10">
                                <span className="text-xs font-mono text-gray-500">{mod.duration_minutes || 0} mins</span>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setPlayingUrl(mod.content_url)} className="p-2 text-violet-400 hover:text-white hover:bg-violet-500 rounded-lg transition-colors"><PlayCircle size={16} /></button>
                                    <button onClick={() => handleEdit(mod)} className="p-2 text-gray-400 hover:text-blue-400 transition-colors"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(mod.id)} className="p-2 text-gray-400 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {playingUrl && (
                <VideoModal url={playingUrl} onClose={() => setPlayingUrl(null)} />
            )}

            {isFormOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#161a29] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-[#111524]">
                            <h3 className="font-bold text-lg text-white">{editingId ? 'Edit Module' : 'Create New Module'}</h3>
                            <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-white p-2 hover:bg-white/5 rounded-full"><X size={20}/></button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            <form id="moduleForm" onSubmit={handleSave} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Module Title</label>
                                    <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} type="text" className="w-full bg-[#0a0f1c] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-violet-500 transition-colors" placeholder="e.g. Introduction to React Native" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Description</label>
                                    <textarea required rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-[#0a0f1c] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-violet-500 transition-colors resize-none" placeholder="Brief context on what the user will learn..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Content URL (Media / PDF / YouTube)</label>
                                    <input value={formData.content_url} onChange={e => setFormData({...formData, content_url: e.target.value})} type="text" className="w-full bg-[#0a0f1c] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-violet-500 transition-colors" placeholder="https://youtube.com/..." />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Duration (Mins)</label>
                                        <input required value={formData.duration_minutes} onChange={e => setFormData({...formData, duration_minutes: parseInt(e.target.value) || 0})} type="number" min="0" className="w-full bg-[#0a0f1c] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-violet-500 transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Difficulty</label>
                                        <select value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})} className="w-full bg-[#0a0f1c] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-violet-500 transition-colors appearance-none cursor-pointer">
                                            <option value="Beginner">Beginner</option>
                                            <option value="Intermediate">Intermediate</option>
                                            <option value="Advanced">Advanced</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Provider Platform</label>
                                    <input value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value})} type="text" className="w-full bg-[#0a0f1c] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-violet-500 transition-colors" placeholder="Enroute Interactive" />
                                </div>
                            </form>
                        </div>
                        
                        <div className="p-6 border-t border-white/10 bg-[#111524] flex items-center justify-end shrink-0 gap-3">
                            <button onClick={() => setIsFormOpen(false)} className="px-6 py-3 rounded-xl font-bold bg-white/5 hover:bg-white/10 text-white transition-colors">Cancel</button>
                            <button form="moduleForm" type="submit" className="bg-violet-600 hover:bg-violet-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-violet-500/20 transition-all">
                                <Save className="w-5 h-5" />
                                Save Module
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
