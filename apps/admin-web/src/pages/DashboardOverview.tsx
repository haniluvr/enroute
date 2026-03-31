import { Users, Briefcase, Brain, Activity, Target } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

export const DashboardOverview = () => {
  const [stats, setStats] = useState({
    users: 0,
    recommendations: 0,
    conversations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentRecs, setRecentRecs] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, convosRes, recsRes, recentRecsRes] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('conversations').select('*', { count: 'exact', head: true }),
          supabase.from('learning_paths').select('*', { count: 'exact', head: true }).ilike('title', '⭐ Target Role:%'),
          supabase.from('learning_paths').select('id, title, created_at, user_id, profiles(first_name, last_name)').ilike('title', '⭐ Target Role:%').order('created_at', { ascending: false }).limit(5)
        ]);

        setStats({
          users: usersRes.count || 0,
          conversations: convosRes.count || 0,
          recommendations: recsRes.count || 0,
        });

        if (recentRecsRes.data) {
            setRecentRecs(recentRecsRes.data);
        }
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
    { label: 'Agency Recommendations Pushed', value: loading ? '...' : stats.recommendations, icon: Target, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'AI Coach Engagements', value: loading ? '...' : stats.conversations, icon: Brain, color: 'text-violet-400', bg: 'bg-violet-400/10' },
    { label: 'Active Job Opportunities (JSearch)', value: 'Live Feed', icon: Briefcase, color: 'text-fuchsia-400', bg: 'bg-fuchsia-400/10' },
  ];

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
          <Activity className="w-8 h-8 text-blue-500" />
          Enroute Operations Center
        </h1>
        <p className="text-gray-400">High-level insights tracking talent performance and active job pipelines.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#161a29] p-6 backdrop-blur-sm transition-all hover:bg-white/5 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1">
            <div className="flex items-center gap-4 relative z-10">
              <div className={`p-4 rounded-xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-[12px] font-bold tracking-widest uppercase text-gray-500 line-clamp-2">{stat.label}</p>
                <p className="text-3xl font-black text-white mt-1">{stat.value}</p>
              </div>
            </div>
            <div className={`absolute -right-12 -top-12 h-32 w-32 rounded-full ${stat.bg} opacity-20 blur-3xl transition-opacity group-hover:opacity-40`}></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="col-span-2 rounded-2xl border border-white/10 bg-[#161a29] p-8 min-h-[400px] flex flex-col items-center justify-center">
             <Activity className="w-16 h-16 text-gray-600 mb-4 opacity-50" />
             <h3 className="text-xl font-bold text-gray-400">Placement Analytics</h3>
             <p className="text-gray-600 mt-2 text-center max-w-sm">
                Skill matching trends and active placement funnels will appear here as more users accept Agency recommendations.
             </p>
          </div>

          <div className="col-span-1 rounded-2xl border border-white/10 bg-[#161a29] p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Recent Recommendations</h3>
              {recentRecs.length > 0 ? (
                  <div className="space-y-4">
                      {recentRecs.map((rec, i) => (
                          <div key={i} className="pb-4 border-b border-white/5 last:border-0 last:pb-0">
                              <p className="text-sm font-bold text-blue-400 truncate">{rec.title.replace('⭐ Target Role: ', '')}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                To: {rec.profiles?.first_name || 'User'} {rec.profiles?.last_name || ''}
                              </p>
                              <p className="text-[10px] text-gray-600 font-mono mt-1">{new Date(rec.created_at).toLocaleString()}</p>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="text-center py-10">
                      <Target className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No recent job recommendations pushed to users.</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};
