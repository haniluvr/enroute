import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { X, Send, Search, Activity } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  employer: string;
  jobLink: string;
}

export const MassBlastModal = ({ isOpen, onClose, jobTitle, employer, jobLink }: Props) => {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isPushing, setIsPushing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('profiles').select('id, first_name, last_name, email').order('first_name');
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users for mass blast", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (id: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedUsers(newSelected);
  };

  const selectAll = () => {
    const newSelected = new Set(users.map(u => u.id));
    setSelectedUsers(newSelected);
  };

  const clearSelection = () => {
    setSelectedUsers(new Set());
  };

  const filteredUsers = users.filter(u => 
    `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBlast = async () => {
    if (selectedUsers.size === 0) return alert("Select at least one user.");
    setIsPushing(true);

    try {
      const roadmapsToInsert = Array.from(selectedUsers).map(userId => ({
        user_id: userId,
        target_role: `⭐ Job Match: ${jobTitle}`,
        goal: `Agency Hand-Picked Recommendation for ${employer}. \nApply here: ${jobLink}`,
        current_level: 'entry',
        estimated_time: '1 week',
        is_completed: false
      }));

      const { error } = await supabase.from('roadmaps').insert(roadmapsToInsert);
      
      if (error) throw error;
      
      alert(`Successfully blasted recommendation to ${selectedUsers.size} users!`);
      setSelectedUsers(new Set());
      onClose();
    } catch (error: any) {
      alert(`Error blasting recommendations: ${error.message}`);
    } finally {
      setIsPushing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#161a29] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-[#111524]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Send className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white leading-tight">Mass Recommendation Blast</h3>
              <p className="text-xs text-gray-400">Target Role: <span className="text-white">{jobTitle}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2 hover:bg-white/5 rounded-full transition-colors"><X size={20}/></button>
        </div>

        <div className="p-6 flex-1 overflow-hidden flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search users..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#0a0f1c] border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={selectAll} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-colors">Select All</button>
              <button onClick={clearSelection} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-colors">Clear</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar border border-white/5 rounded-xl bg-[#0a0f1c]">
            {loading ? (
              <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                <Activity className="animate-spin mb-2 w-6 h-6 text-blue-500" />
                Loading talent pool...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No users match your search.</div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredUsers.map(u => (
                  <label key={u.id} className="flex items-center gap-4 p-4 hover:bg-white/5 cursor-pointer transition-colors group">
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        checked={selectedUsers.has(u.id)}
                        onChange={() => toggleUser(u.id)}
                        className="peer appearance-none w-5 h-5 border-2 border-gray-600 rounded-md checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer"
                      />
                      <div className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </div>
                    </div>
                    
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-blue-500 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                      {u.first_name?.[0] || u.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-blue-200 transition-colors">{u.first_name || 'Unknown'} {u.last_name || ''}</h4>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-white/10 bg-[#111524] flex items-center justify-between shrink-0">
          <div className="text-sm">
            <span className="text-gray-400">Selected: </span>
            <span className="font-bold text-white text-lg">{selectedUsers.size}</span>
            <span className="text-gray-500 ml-1">users</span>
          </div>
          
          <button 
            onClick={handleBlast} 
            disabled={isPushing || selectedUsers.size === 0}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 disabled:text-gray-500 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
          >
            {isPushing ? <Activity className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {isPushing ? 'Blasting...' : 'Send Mass Blast'}
          </button>
        </div>
      </div>
    </div>
  );
};
