import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { RefreshCw, UserPlus, X, Send, Activity } from 'lucide-react';

export const UsersManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [shortlistingUser, setShortlistingUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Users Management</h1>
          <p className="text-gray-400">Total users registered: {users.length}</p>
        </div>
        <div className="flex gap-4">
          <button className="px-4 py-2 flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-medium transition-colors">
             <span className="text-gray-400">Y</span> Filters
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#1c2136] overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <RefreshCw className="w-6 h-6 text-violet-400 animate-spin" />
            <span className="ml-3 text-gray-400">Loading users...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-400 bg-red-500/10 m-6 rounded-lg border border-red-500/20">
            {error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Persona</th>
                  <th className="px-6 py-4">Interest</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                          {user.first_name ? user.first_name[0] : user.email?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">{user.first_name} {user.last_name}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {user.persona || 'neutral'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 flex items-center gap-2">
                      <span className="text-gray-500 text-xs text-center border p-1 rounded-sm border-gray-500/20 leading-[8px] tracking-[-2px]">💼</span>
                      {user.career_interest || 'Not set'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        <button 
                          onClick={() => setShortlistingUser(user)}
                          className="text-violet-400 hover:text-violet-300 transition-colors inline-flex items-center gap-1 group text-xs font-bold uppercase tracking-wider"
                        >
                          <UserPlus className="w-4 h-4" /> Shortlist
                        </button>
                        <button 
                          onClick={() => navigate(`/dashboard/users/${user.id}`)}
                          className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1 group"
                        >
                          Manage <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {shortlistingUser && (
        <ShortlistModal 
          user={shortlistingUser} 
          onClose={() => setShortlistingUser(null)} 
          onSuccess={() => fetchUsers()} 
        />
      )}
    </div>
  );
};

const ShortlistModal = ({ user, onClose, onSuccess }: { user: any, onClose: () => void, onSuccess: () => void }) => {
  const [recs, setRecs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchRecs = async () => {
      const { data } = await supabase
        .from('roadmaps')
        .select('*')
        .eq('user_id', user.id)
        .ilike('target_role', '⭐ Job Match:%');
      setRecs(data || []);
      setLoading(false);
    };
    fetchRecs();
  }, [user.id]);

  const handleShortlist = async () => {
    if (!selectedId) return alert("Please select a recommendation.");
    setIsSubmitting(true);
    try {
      const rec = recs.find(r => r.id === selectedId);
      const cleanRole = rec.target_role.replace('⭐ Job Match: ', '');
      
      const { error } = await supabase.from('roadmaps').insert({
        user_id: user.id,
        target_role: `⭐ Shortlist: ${cleanRole}`,
        goal: `Manual agency shortlist for ${cleanRole}.`,
        current_level: 'entry',
        estimated_time: 'Shortlisted',
        is_completed: false
      });

      if (error) throw error;
      alert(`User added to ${cleanRole} shortlist!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(`Shortlist failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#161a29] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-[#111524]">
          <h3 className="font-bold text-lg text-white">Shortlist Resource</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={20}/></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
            <div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
              {user.first_name?.[0] || user.email?.[0].toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-white tracking-tight">{user.first_name} {user.last_name}</p>
              <p className="text-xs text-blue-400 font-medium">{user.email}</p>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Select Recommended Job</label>
            {loading ? (
              <div className="py-8 text-center"><Activity className="animate-spin w-6 h-6 text-blue-500 mx-auto" /></div>
            ) : recs.length === 0 ? (
              <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl text-xs text-red-400 text-center">
                No active job matches found for this user. 
                Push a recommendation from the Job Board first.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                {recs.map(r => (
                  <label key={r.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${selectedId === r.id ? 'bg-blue-600/20 border-blue-500/50' : 'bg-white/5 border-white/5 hover:border-white/20'}`}>
                    <input type="radio" name="rec" value={r.id} checked={selectedId === r.id} onChange={() => setSelectedId(r.id)} className="sr-only" />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedId === r.id ? 'border-blue-400 bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]' : 'border-gray-600'}`}>
                      {selectedId === r.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className="text-sm text-gray-200 font-medium truncate">{r.target_role.replace('⭐ Job Match: ', '')}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          
          <button 
            onClick={handleShortlist} 
            disabled={isSubmitting || !selectedId} 
            className="w-full mt-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:bg-white/5 disabled:text-gray-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 transition-all active:scale-[0.98]"
          >
            {isSubmitting ? <Activity className="animate-spin w-5 h-5"/> : <Send className="w-5 h-5" />}
            Confirm Shortlist
          </button>
        </div>
      </div>
    </div>
  );
};
