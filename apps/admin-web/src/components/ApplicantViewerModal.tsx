import { useState, useEffect } from 'react';
import { X, Search, Download, User as UserIcon, Filter, Activity } from 'lucide-react';
import { supabase } from '../config/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  employer: string;
}

const STATUS_COLORS: Record<string, string> = {
  'Recommended': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Shortlisted': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  'Applied': 'bg-green-500/10 text-green-400 border-green-500/20',
  'Under Review': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'Interviewed': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Offered': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Hired': 'bg-green-500/20 text-green-300 border-green-500/30',
  'Rejected': 'bg-red-500/10 text-red-400 border-red-500/20',
};

export const ApplicantViewerModal = ({ isOpen, onClose, jobTitle, employer }: Props) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchApplicants();
    }
  }, [isOpen, jobTitle]);

  const fetchApplicants = async () => {
    setLoading(true);
    try {
      // 1. Fetch users who were recommended/shortlisted via 'roadmaps' table
      const { data: roadmapData } = await supabase
        .from('roadmaps')
        .select('id, created_at, target_role, user_id, profiles(id, first_name, last_name, email, career_interest)')
        .or(`target_role.ilike.%${jobTitle}%`)
        .order('created_at', { ascending: false });

      // 2. Fetch users who applied or were shortlisted via 'job_applications' table
      const { data: applicationData } = await supabase
        .from('job_applications')
        .select('id, created_at, status, user_id, profiles(id, first_name, last_name, email, career_interest)')
        .or(`job_title.ilike.%${jobTitle}%`)
        .order('created_at', { ascending: false });

      // Map profiles by ID to merge
      const candidatesMap = new Map<string, any>();

      // Recommendations first
      (roadmapData || []).forEach(r => {
        const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
        if (!profile) return;
        
        let status = 'Recommended';
        if (r.target_role.includes('⭐ Shortlist')) status = 'Shortlisted';
        if (r.target_role.includes('⭐ Interviewing')) status = 'Interviewed';
        if (r.target_role.includes('⭐ Hired')) status = 'Hired';
        if (r.target_role.includes('⭐ Rejected')) status = 'Rejected';

        candidatesMap.set(profile.id, {
          id: profile.id,
          roadmapId: r.id,
          name: `${profile.first_name || 'Unknown'} ${profile.last_name || ''}`,
          email: profile.email,
          status: status,
          date: new Date(r.created_at).toLocaleDateString(),
          roleName: r.target_role.split(': ')[1] || jobTitle,
          experience: profile.career_interest || 'Entry Level',
          link: '#'
        });
      });

      // Applications/Shortlists overrides or additions
      (applicationData || []).forEach(a => {
        const profile = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles;
        if (!profile) return;
        
        const existing = candidatesMap.get(profile.id);
        const status = a.status ? a.status.charAt(0).toUpperCase() + a.status.slice(1).toLowerCase() : 'Applied';
        
        candidatesMap.set(profile.id, {
          ...(existing || {}),
          id: profile.id,
          appId: a.id,
          name: `${profile.first_name || 'Unknown'} ${profile.last_name || ''}`,
          email: profile.email,
          status: status,
          date: new Date(a.created_at).toLocaleDateString(),
          experience: profile.career_interest || 'Entry Level',
          link: '#'
        });
      });

      setApplicants(Array.from(candidatesMap.values()));
    } catch (err) {
      console.error("Error fetching applicants:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (appId: string | undefined, userId: string, newStatus: string, roadmapId?: string, roleName?: string) => {
    try {
      if (appId) {
        // Update real application
        await supabase.from('job_applications').update({ status: newStatus.toLowerCase() }).eq('id', appId);
      } else if (roadmapId) {
        // Update admin recommendation/shortlist prefix
        let prefix = '⭐ Job Match';
        if (newStatus === 'Shortlisted') prefix = '⭐ Shortlisted';
        if (newStatus === 'Interviewed') prefix = '⭐ Interviewing';
        if (newStatus === 'Hired') prefix = '⭐ Hired';
        if (newStatus === 'Rejected') prefix = '⭐ Rejected';
        
        await supabase.from('roadmaps').update({ 
            target_role: `${prefix}: ${roleName || jobTitle}` 
        }).eq('id', roadmapId);
      } else {
        // If no application record exists yet, create one (Fallback)
        await supabase.from('job_applications').insert({
          user_id: userId,
          job_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID if required
          status: newStatus.toLowerCase()
        });
      }
      fetchApplicants();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  if (!isOpen) return null;

  const filteredApplicants = applicants.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0a0f1c] border border-white/10 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/10 bg-[#111524] flex justify-between items-center shrink-0 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <UserIcon className="w-7 h-7 text-violet-400" />
              Applicant Viewer
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Reviewing candidates for <span className="text-blue-400 font-bold">{jobTitle}</span> at <span className="text-white">{employer}</span>
            </p>
          </div>
          <div className="flex items-center gap-4 relative z-10">
             <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-sm font-bold text-white transition-colors">
                <Download className="w-4 h-4 text-emerald-400" /> Export CSV
             </button>
             <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
               <X className="w-6 h-6" />
             </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-6 flex gap-4 border-b border-white/5 shrink-0 bg-[#0d1326]">
           <div className="relative flex-1">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
             <input 
               type="text" 
               placeholder="Search applicants by name or email..." 
               value={search}
               onChange={e => setSearch(e.target.value)}
               className="w-full bg-[#161a29] border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:border-violet-500 outline-none transition-colors"
             />
           </div>
           <div className="relative">
             <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
             <select 
               value={statusFilter}
               onChange={e => setStatusFilter(e.target.value)}
               className="appearance-none bg-[#161a29] border border-white/5 rounded-xl py-3 pl-11 pr-10 text-sm text-white focus:border-violet-500 outline-none transition-colors font-semibold cursor-pointer"
             >
                <option className="text-gray-900" value="All">All Statuses</option>
                <option className="text-gray-900" value="Recommended">Recommended</option>
                <option className="text-gray-900" value="Shortlisted">Shortlisted</option>
                <option className="text-gray-900" value="Applied">Applied</option>
                <option className="text-gray-900" value="Under Review">Under Review</option>
                <option className="text-gray-900" value="Interviewed">Interviewed</option>
                <option className="text-gray-900" value="Offered">Offered</option>
                <option className="text-gray-900" value="Hired">Hired</option>
                <option className="text-gray-900" value="Rejected">Rejected</option>
             </select>
           </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto bg-[#0a0f1c] custom-scrollbar p-6">
           <div className="border border-white/5 rounded-2xl overflow-hidden">
             <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#111524] text-xs uppercase tracking-widest text-gray-500 font-bold">
                    <th className="p-4 border-b border-white/5">Applicant</th>
                    <th className="p-4 border-b border-white/5">Applied On</th>
                    <th className="p-4 border-b border-white/5">Experience</th>
                    <th className="p-4 border-b border-white/5">Status</th>
                    <th className="p-4 border-b border-white/5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-gray-500">
                        <Activity className="w-12 h-12 mx-auto mb-3 animate-spin text-violet-500" />
                        <p>Loading actual applicants...</p>
                      </td>
                    </tr>
                  ) : filteredApplicants.length > 0 ? filteredApplicants.map(app => (
                    <tr key={app.id} className="hover:bg-white/[0.02] transition-colors group">
                       <td className="p-4">
                         <p className="font-bold text-white group-hover:text-blue-300 transition-colors">{app.name}</p>
                         <p className="text-xs text-gray-500">{app.email}</p>
                       </td>
                       <td className="p-4 text-sm text-gray-400">{app.date}</td>
                       <td className="p-4 text-sm font-medium text-gray-300">{app.experience}</td>
                       <td className="p-4">
                         <span className={`px-3 py-1 text-xs font-bold uppercase rounded-md border ${STATUS_COLORS[app.status] || ''}`}>
                           {app.status}
                         </span>
                       </td>
                       <td className="p-4">
                         <div className="flex items-center justify-center gap-2">
                            <select 
                              onChange={(e) => updateStatus(app.appId, app.id, e.target.value, app.roadmapId, app.roleName)}
                              className="bg-[#161a29] border border-white/10 text-xs text-gray-300 rounded-lg p-2 outline-none cursor-pointer"
                            >
                              <option className="text-gray-900" value="">Update Status...</option>
                              <option className="text-gray-900" value="Recommended">Recommended</option>
                              <option className="text-gray-900" value="Shortlisted">Shortlisted</option>
                              <option className="text-gray-900" value="Applied">Applied</option>
                              <option className="text-gray-900" value="Under Review">Under Review</option>
                              <option className="text-gray-900" value="Interviewed">Interviewed</option>
                              <option className="text-gray-900" value="Offered">Offered</option>
                              <option className="text-gray-900" value="Hired">Hired</option>
                              <option className="text-gray-900" value="Rejected">Rejected</option>
                            </select>
                         </div>
                       </td>
                    </tr>
                  )) : (
                    <tr>
                       <td colSpan={5} className="p-12 text-center text-gray-500">
                         <UserIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                         <p>No actual recommended or applied users found for this job.</p>
                       </td>
                    </tr>
                  )}
                </tbody>
             </table>
           </div>
        </div>
      </div>
    </div>
  );
};
