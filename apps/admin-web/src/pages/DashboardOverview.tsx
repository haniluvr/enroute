import { Users, Briefcase, Brain, Activity, Target, TrendingUp, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#6834F5', '#00F0FF', '#FF2A85', '#05FFAC', '#F5A623'];

export const DashboardOverview = () => {
  const [stats, setStats] = useState({
    users: 0,
    recommendations: 0,
    conversations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentRecs, setRecentRecs] = useState<any[]>([]);
  const [dateFilter, setDateFilter] = useState('Last 30 Days');

  const [professionData, setProfessionData] = useState<any[]>([]);
  const [experienceData, setExperienceData] = useState<any[]>([]);
  const [hiringMetrics, setHiringMetrics] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          { data: profilesData }, 
          convosRes, 
          learningPathsRes, 
          roadmapsRes, 
          recentRoadmaps
        ] = await Promise.all([
          supabase.from('profiles').select('persona, career_interest'),
          supabase.from('conversations').select('*', { count: 'exact', head: true }),
          supabase.from('learning_paths').select('*', { count: 'exact', head: true }).ilike('title', '⭐ Target Role:%'),
          supabase.from('roadmaps').select('*', { count: 'exact', head: true }).ilike('target_role', '⭐ Job Match:%'),
          supabase.from('roadmaps').select('id, target_role, created_at, user_id, profiles(first_name, last_name)').ilike('target_role', '⭐ Job Match:%').order('created_at', { ascending: false }).limit(5)
        ]);

        setStats({
          users: profilesData?.length || 0,
          conversations: convosRes.count || 0,
          recommendations: (learningPathsRes.count || 0) + (roadmapsRes.count || 0),
        });

        if (recentRoadmaps.data) {
            setRecentRecs(recentRoadmaps.data);
        }

        // --- Aggregate Analytics from Real Data ---
        const roleCounts: Record<string, number> = {};
        const personaCounts: Record<string, number> = {};
        (profilesData || []).forEach(p => {
            const role = p.career_interest || 'Unspecified';
            const persona = p.persona || 'Not Set';
            roleCounts[role] = (roleCounts[role] || 0) + 1;
            personaCounts[persona] = (personaCounts[persona] || 0) + 1;
        });

        const mappedRoles = Object.entries(roleCounts).map(([name, users]) => ({ name, users })).sort((a,b) => b.users - a.users);
        setProfessionData(mappedRoles.length > 0 ? mappedRoles : [{ name: 'No Data', users: 0 }]);
        
        const mappedPersonas = Object.entries(personaCounts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
        setExperienceData(mappedPersonas.length > 0 ? mappedPersonas : [{ name: 'No Data', value: 0 }]);

        // Since we don't have a live applications table yet, zero out metrics
        setHiringMetrics([
           { label: 'Overall Hired Rate', value: '0%', trend: '0%', isPositive: true },
           { label: 'App-to-Hire Ratio', value: '0:0', trend: 'N/A', isPositive: true },
           { label: 'Avg Time to Hire', value: '0 Days', trend: '-', isPositive: true },
           { label: 'Offer Acceptance', value: '0%', trend: '0%', isPositive: true },
        ]);

        setTrendData([
           { name: 'Week 1', apps: 0, hires: 0 },
           { name: 'Week 2', apps: 0, hires: 0 },
           { name: 'Week 3', apps: 0, hires: 0 },
           { name: 'Week 4', apps: 0, hires: 0 },
        ]);

      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: 'Total Users', value: loading ? '...' : stats.users, icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Total Agency Flashes Sent', value: loading ? '...' : stats.recommendations, icon: Target, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'AI Coach Engagements', value: loading ? '...' : stats.conversations, icon: Brain, color: 'text-violet-400', bg: 'bg-violet-400/10' },
    { label: 'Active Job Opportunities', value: 'Live Feed', icon: Briefcase, color: 'text-fuchsia-400', bg: 'bg-fuchsia-400/10' },
  ];

  return (
    <div className="space-y-6 max-w-7xl pb-16">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-500" />
            Dashboard & Analytics
          </h1>
          <p className="text-gray-400">High-level insights tracking talent performance and active job pipelines.</p>
        </div>
        <div className="flex items-center gap-3 relative">
          <Filter className="w-5 h-5 text-gray-500 absolute left-3" />
          <select
             value={dateFilter}
             onChange={e => setDateFilter(e.target.value)}
             className="bg-[#161a29] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-blue-500 outline-none appearance-none cursor-pointer"
          >
             <option>Last 30 Days</option>
             <option>Last 3 Months</option>
             <option>Last 6 Months</option>
             <option>All Time</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#161a29] p-6 backdrop-blur-sm transition-all hover:bg-white/5 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1">
            <div className="flex items-center gap-4 relative z-10">
              <div className={`p-4 rounded-xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-bold tracking-widest uppercase text-gray-400 line-clamp-2">{stat.label}</p>
                <p className="text-3xl font-black text-white mt-1">{stat.value}</p>
              </div>
            </div>
            <div className={`absolute -right-12 -top-12 h-32 w-32 rounded-full ${stat.bg} opacity-20 blur-3xl transition-opacity group-hover:opacity-40`}></div>
          </div>
        ))}
      </div>

      {/* Analytics Main Section */}
      <div className="mt-10 space-y-6">
        <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-widest border-b border-white/10 pb-2">Hiring Analytics</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {hiringMetrics.map((metric, i) => (
             <div key={i} className="bg-[#0d1326] border border-white/5 rounded-2xl p-5">
                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-2">{metric.label}</p>
                <div className="flex items-end gap-3">
                   <span className="text-3xl font-black text-white">{metric.value}</span>
                   <span className={`text-sm font-bold flex items-center mb-1 ${metric.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                      <TrendingUp className="w-4 h-4 mr-1" /> {metric.trend}
                   </span>
                </div>
             </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Bar Chart */}
           <div className="col-span-1 lg:col-span-2 bg-[#161a29] border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-6">Talent Pipeline Breakdown (Role vs Applications)</h3>
              <div className="h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={professionData}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                     <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                     <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                     <Tooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{ backgroundColor: '#111524', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                     />
                     <Bar dataKey="users" fill="#6834F5" radius={[6, 6, 0, 0]} />
                   </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* Recent Recommendations (Bug Fix) */}
           <div className="col-span-1 bg-[#161a29] border border-white/5 rounded-2xl p-6 flex flex-col">
               <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-6">Recent Job Blasts</h3>
               <div className="flex-1 overflow-y-auto custom-scrollbar">
                 {recentRecs.length > 0 ? (
                     <div className="space-y-4">
                         {recentRecs.map((rec, i) => (
                             <div key={i} className="pb-4 border-b border-white/5 last:border-0 last:pb-0">
                                 <p className="text-sm font-bold text-blue-400 truncate">
                                    {rec.target_role?.replace('⭐ Job Match: ', '') || 'Unknown Role'}
                                 </p>
                                 <p className="text-xs text-gray-400 mt-1">
                                   Target: {rec.profiles?.first_name || 'User'} {rec.profiles?.last_name || ''}
                                 </p>
                                 <p className="text-[10px] text-gray-600 font-mono mt-1">{new Date(rec.created_at).toLocaleString()}</p>
                             </div>
                         ))}
                     </div>
                 ) : (
                     <div className="text-center py-10">
                         <Target className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                         <p className="text-gray-500 text-sm">No recent job recommendations pushed to users.</p>
                         <p className="text-xs text-gray-600 mt-2">Use the Mass Blast feature in Job Board.</p>
                     </div>
                 )}
               </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="bg-[#161a29] border border-white/5 rounded-2xl p-6 flex flex-col items-center">
             <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-2 self-start">Experience Level Distribution</h3>
             <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={experienceData}
                       cx="50%"
                       cy="50%"
                       innerRadius={60}
                       outerRadius={90}
                       paddingAngle={5}
                       dataKey="value"
                     >
                       {experienceData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                     </Pie>
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#111524', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                     />
                   </PieChart>
                </ResponsiveContainer>
             </div>
             <div className="flex flex-wrap justify-center gap-4 mt-2">
               {experienceData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs text-gray-400 font-bold">
                     <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                     {entry.name}
                  </div>
               ))}
             </div>
          </div>

          {/* Line Chart */}
          <div className="bg-[#161a29] border border-white/5 rounded-2xl p-6">
             <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-6">Activity Over Time</h3>
             <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#111524', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                     />
                    <Line type="monotone" dataKey="apps" stroke="#6834F5" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Applications" />
                    <Line type="monotone" dataKey="hires" stroke="#05FFAC" strokeWidth={3} dot={{ r: 4 }} name="Hires Secured" />
                  </LineChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
