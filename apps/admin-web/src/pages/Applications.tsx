import { useState, useEffect } from 'react';
import { Search, Filter, Activity, User as UserIcon, CheckCircle, XCircle, Clock, Briefcase } from 'lucide-react';
import { supabase } from '../config/supabase';
import { useNavigate } from 'react-router-dom';

const STATUS_COLORS: Record<string, string> = {
  'Recommended': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Interest': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  'Shortlisted': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  'Applied': 'bg-green-500/10 text-green-400 border-green-500/20',
  'Under Review': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'Interviewed': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Offered': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Hired': 'bg-green-500/20 text-green-300 border-green-500/30',
  'Rejected': 'bg-red-500/10 text-red-400 border-red-500/20',
};

export const Applications = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplicants();
  }, []);

  const fetchApplicants = async () => {
    setLoading(true);
    try {
      const [roadmapRes, applicationRes] = await Promise.all([
        supabase
          .from('roadmaps')
          .select('id, created_at, target_role, user_id, profiles(id, first_name, last_name, email, career_interest)')
          .order('created_at', { ascending: false }),
        supabase
          .from('job_applications')
          .select('id, created_at, status, job_title, user_id, profiles(id, first_name, last_name, email, career_interest)')
          .order('created_at', { ascending: false })
      ]);

      const candidatesMap = new Map<string, any>();

      (roadmapRes.data || []).forEach(r => {
        const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
        if (!profile) return;
        
        const isAgencyMatch = r.target_role?.includes('⭐');
        let status = isAgencyMatch ? 'Recommended' : 'Interest';
        
        if (r.target_role?.includes('⭐ Shortlist')) status = 'Shortlisted';
        if (r.target_role?.includes('⭐ Interviewing')) status = 'Interviewed';
        if (r.target_role?.includes('⭐ Hired')) status = 'Hired';
        if (r.target_role?.includes('⭐ Rejected')) status = 'Rejected';

        const role = isAgencyMatch ? r.target_role.split(': ')[1] || r.target_role : r.target_role;
        const key = `${profile.id}-${role}`;

        candidatesMap.set(key, {
          id: profile.id,
          roadmapId: r.id,
          name: `${profile.first_name || 'Candidate'} ${profile.last_name || ''}`,
          email: profile.email,
          status: status,
          date: new Date(r.created_at).toLocaleDateString(),
          jobTitle: role,
          experience: profile.career_interest || 'Potential Match',
          source: isAgencyMatch ? 'Agency match' : 'User profile'
        });
      });

      (applicationRes.data || []).forEach(a => {
        const profile = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles;
        if (!profile) return;
        
        const role = a.job_title || 'Direct Application';
        const key = `${profile.id}-${role}`;
        const existing = candidatesMap.get(key);
        
        const status = a.status ? a.status.charAt(0).toUpperCase() + a.status.slice(1).toLowerCase() : 'Applied';
        
        candidatesMap.set(key, {
          ...(existing || {}),
          id: profile.id,
          appId: a.id,
          name: `${profile.first_name || 'Candidate'} ${profile.last_name || ''}`,
          email: profile.email,
          status: existing ? existing.status : status,
          date: new Date(a.created_at).toLocaleDateString(),
          jobTitle: role,
          experience: profile.career_interest || 'Active Applicant',
          source: existing ? 'Interacted' : 'User Applied'
        });
      });

      setApplicants(Array.from(candidatesMap.values()));
    } catch (err) {
      console.error("Error fetching applicants:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (item: any, newStatus: string) => {
    try {
      if (item.appId) {
        await supabase.from('job_applications').update({ status: newStatus.toLowerCase() }).eq('id', item.appId);
      }
      
      if (item.roadmapId) {
        let prefix = '⭐ Job Match';
        if (newStatus === 'Shortlisted') prefix = '⭐ Shortlisted';
        if (newStatus === 'Interviewed') prefix = '⭐ Interviewing';
        if (newStatus === 'Hired') prefix = '⭐ Hired';
        if (newStatus === 'Rejected') prefix = '⭐ Rejected';
        
        await supabase.from('roadmaps').update({ 
            target_role: `${prefix}: ${item.jobTitle}` 
        }).eq('id', item.roadmapId);
      } else if (newStatus === 'Recommended' || newStatus === 'Shortlisted') {
          const prefix = newStatus === 'Shortlisted' ? '⭐ Shortlisted' : '⭐ Job Match';
          await supabase.from('roadmaps').insert({
              user_id: item.id,
              target_role: `${prefix}: ${item.jobTitle}`,
              status: 'active'
          });
      }

      fetchApplicants();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const filteredApplicants = applicants.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) || 
                         a.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
                         a.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Applications <span className="text-blue-500">Desk</span></h1>
          <p className="text-gray-400 mt-2 font-medium">Agency Review Center: Manage, Recommend, and Track Candidates</p>
        </div>
        <div className="flex gap-3">
            <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 flex flex-col items-center">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Active Pipeline</span>
                <span className="text-2xl font-black text-blue-400">{applicants.filter(a => a.status !== 'Rejected' && a.status !== 'Hired').length}</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 flex flex-col items-center">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Success Rate</span>
                <span className="text-2xl font-black text-emerald-400">
                    {applicants.length > 0 ? Math.round((applicants.filter(a => a.status === 'Hired').length / applicants.length) * 100) : 0}%
                </span>
            </div>
        </div>
      </div>

      <div className="bg-[#0d1326] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 bg-white/5 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search by name, email, or job role..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#161a29] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:border-blue-500 outline-none transition-all placeholder:text-gray-600"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                <Filter className="w-4 h-4 text-gray-500" />
                <select 
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer"
                >
                    <option value="All" className="text-gray-900">All Statuses</option>
                    <option value="Recommended" className="text-gray-900">Recommended</option>
                    <option value="Interest" className="text-gray-900">Interest</option>
                    <option value="Shortlisted" className="text-gray-900">Shortlisted</option>
                    <option value="Applied" className="text-gray-900">Applied</option>
                    <option value="Interviewed" className="text-gray-900">Interviewed</option>
                    <option value="Hired" className="text-gray-900">Hired</option>
                    <option value="Rejected" className="text-gray-900">Rejected</option>
                </select>
            </div>
            <button 
                onClick={fetchApplicants}
                className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-600/20"
            >
                <Activity className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black bg-white/[0.02]">
                <th className="px-8 py-5">Candidate</th>
                <th className="px-6 py-5">Target Job</th>
                <th className="px-6 py-5">Agency Status</th>
                <th className="px-6 py-5">Matched On</th>
                <th className="px-8 py-5 text-right">Agency Tools</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                      <p className="text-gray-500 font-medium">Syncing applications with agency desk...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredApplicants.map((app) => (
                <tr key={`${app.id}-${app.jobTitle}`} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600/20 to-violet-600/20 border border-white/10 flex items-center justify-center text-blue-400 font-bold group-hover:scale-110 transition-transform">
                        {app.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-wide text-sm">{app.name}</p>
                        <p className="text-xs text-gray-500 font-medium">{app.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6 font-medium text-gray-300">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-3 h-3 text-gray-600" />
                        <span className="text-sm">{app.jobTitle}</span>
                      </div>
                      <p className="text-[10px] text-gray-600 mt-1 uppercase font-bold tracking-widest">{app.source}</p>
                  </td>
                  <td className="px-6 py-6">
                    <span className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest ${STATUS_COLORS[app.status] || ''}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-sm text-gray-500 font-medium">
                    <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {app.date}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => updateStatus(app, 'Recommended')}
                        className="p-2 hover:bg-blue-500/10 text-blue-400 rounded-lg transition-colors border border-transparent hover:border-blue-500/20"
                        title="Recommend to Employer"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => updateStatus(app, 'Rejected')}
                        className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                        title="Reject Candidate"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                      <select 
                        onChange={(e) => updateStatus(app, e.target.value)}
                        className="bg-[#161a29] border border-white/10 text-[10px] font-bold text-gray-400 rounded-lg p-2 outline-none cursor-pointer hover:border-blue-500/40 transition-colors uppercase tracking-widest"
                      >
                        <option value="" className="text-gray-900">Status...</option>
                        <option value="Shortlisted" className="text-gray-900">Shortlist</option>
                        <option value="Interviewed" className="text-gray-900">Interview</option>
                        <option value="Hired" className="text-gray-900">Hire</option>
                      </select>
                      <button 
                        onClick={() => navigate(`/dashboard/users/${app.id}`)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-[10px] font-bold text-gray-400 hover:text-white rounded-lg border border-white/5 transition-colors uppercase tracking-widest"
                      >
                        Profile
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredApplicants.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <UserIcon className="w-12 h-12 text-gray-700 opacity-20" />
                      <p className="text-gray-500 font-medium">No candidate applications or matches found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
