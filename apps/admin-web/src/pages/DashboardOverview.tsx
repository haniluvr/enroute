import { useNavigate } from 'react-router-dom';
import { Users, Briefcase, Brain, Activity, Target, TrendingUp, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from 'recharts';

export const DashboardOverview = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    users: 0,
    recommendations: 0,
    conversations: 0,
    activeJobs: 0,
    totalApplications: 0,
    dailyApplications: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentRecs, setRecentRecs] = useState<any[]>([]);
  const [dateFilter, setDateFilter] = useState('Last 30 Days');

  const [hiringMetrics, setHiringMetrics] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');
  const [rawStats, setRawStats] = useState<{ roadmaps: any[], apps: any[], convos: any[] }>({
    roadmaps: [],
    apps: [],
    convos: []
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          { data: profilesData },
          convosRes,
          learningPathsRes,
          roadmapsRes,
          recentRoadmaps,
          activityRoadmaps,
          applicationsRes,
          assessmentsRes
        ] = await Promise.all([
          supabase.from('profiles').select('persona, career_interest, created_at'),
          supabase.from('conversations').select('*', { count: 'exact', head: false }),
          supabase.from('learning_paths').select('*', { count: 'exact', head: true }).ilike('title', '⭐ %'),
          supabase.from('roadmaps').select('*', { count: 'exact', head: true }).ilike('target_role', '⭐ %'),
          supabase.from('roadmaps').select('id, target_role, created_at, user_id, profiles(first_name, last_name)').ilike('target_role', '⭐ %').order('created_at', { ascending: false }).limit(5),
          supabase.from('roadmaps').select('id, target_role, created_at, user_id, profiles(first_name, last_name, career_interest)').order('created_at', { ascending: false }),
          supabase.from('job_applications').select('status, created_at').order('created_at', { ascending: false }),
          supabase.from('career_assessments').select('match_percentage')
        ]);

        const activeJobsSet = new Set(
          (activityRoadmaps.data || [])
            .filter(r => r.target_role?.includes('⭐'))
            .map(r => r.target_role.split(': ')[1] || r.target_role)
        );
        const stats_users = profilesData?.length || 0;
        const stats_convos = convosRes.count || 0;
        const stats_recs = (learningPathsRes.count || 0) + (roadmapsRes.count || 0);

        const totalHired = (applicationsRes.data || []).filter(a => a.status?.toLowerCase() === 'hired').length +
          (activityRoadmaps.data || []).filter(r => r.target_role?.includes('⭐ Hired')).length;

        const totalVolume = (activityRoadmaps.data?.length || 0) + (applicationsRes.data?.length || 0) + (convosRes.data?.length || 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let dailyCount = 0;
        (activityRoadmaps.data || []).forEach(r => { if (new Date(r.created_at) >= today) dailyCount++; });
        (applicationsRes.data || []).forEach(a => { if (new Date(a.created_at) >= today) dailyCount++; });
        (convosRes.data || []).forEach(c => { if (new Date(c.created_at) >= today) dailyCount++; });

        setStats({
          users: stats_users,
          conversations: stats_convos,
          recommendations: stats_recs,
          activeJobs: activeJobsSet.size,
          totalApplications: totalVolume,
          dailyApplications: dailyCount
        });

        if (recentRoadmaps.data) {
          setRecentRecs(recentRoadmaps.data);
        }

        const hiredRate = totalVolume > 0 ? Math.round((totalHired / totalVolume) * 100) : 0;

        const totalAssessments = assessmentsRes.data?.length || 0;
        const avgScore = totalAssessments > 0
          ? Math.round((assessmentsRes.data || []).reduce((acc: number, curr: any) => acc + (curr.match_percentage || 0), 0) / totalAssessments)
          : 0;

        const shortlistedAppsCount = (applicationsRes.data || []).filter(a => a.status?.toLowerCase() === 'shortlisted').length;
        const shortlistedRoadmapsCount = (activityRoadmaps.data || []).filter(r => r.target_role?.includes('⭐ Shortlisted') || r.target_role?.includes('⭐ Shortlist')).length;
        const shortlistedCount = shortlistedAppsCount + shortlistedRoadmapsCount;

        setHiringMetrics([
          { label: 'Overall Hired Rate', value: hiredRate > 0 ? `${hiredRate}%` : '0%', trend: hiredRate > 0 ? '+5%' : '0%', isPositive: hiredRate > 0 },
          { label: 'Avg Matching Score', value: avgScore > 0 ? `${avgScore}%` : '0%', trend: '+2%', isPositive: true },
          { label: 'Shortlisted Candidates', value: shortlistedCount, trend: shortlistedCount > 0 ? 'Active' : '0', isPositive: shortlistedCount > 0 },
          { label: 'Rec User Growth', value: `+${profilesData?.length || 0}`, trend: 'Active', isPositive: true },
        ]);

        setRawStats({
          roadmaps: activityRoadmaps.data || [],
          apps: applicationsRes.data || [],
          convos: convosRes.data || []
        });

      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    calculateTrend();
  }, [timeframe, rawStats]);

  const calculateTrend = () => {
    const data: any[] = [];
    const now = new Date();

    if (timeframe === 'daily') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const label = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : `${d.getMonth() + 1}/${d.getDate()}`;

        let apps = 0;
        let recs = 0;

        rawStats.apps.forEach(a => { if (new Date(a.created_at) >= d && new Date(a.created_at) < new Date(d.getTime() + 86400000)) apps++; });
        rawStats.roadmaps.forEach(r => { if (new Date(r.created_at) >= d && new Date(r.created_at) < new Date(d.getTime() + 86400000)) { apps++; if (r.target_role?.includes('⭐')) recs++; } });
        rawStats.convos.forEach(c => { if (new Date(c.created_at) >= d && new Date(c.created_at) < new Date(d.getTime() + 86400000)) apps++; });

        data.push({ name: label, apps, recs });
      }
    } else if (timeframe === 'weekly') {
      for (let i = 3; i >= 0; i--) {
        const start = new Date();
        start.setDate(now.getDate() - (i * 7 + 7));
        const end = new Date();
        end.setDate(now.getDate() - (i * 7));

        let apps = 0;
        let recs = 0;

        rawStats.apps.forEach(a => { if (new Date(a.created_at) >= start && new Date(a.created_at) < end) apps++; });
        rawStats.roadmaps.forEach(r => { if (new Date(r.created_at) >= start && new Date(r.created_at) < end) { apps++; if (r.target_role?.includes('⭐')) recs++; } });
        rawStats.convos.forEach(c => { if (new Date(c.created_at) >= start && new Date(c.created_at) < end) apps++; });

        data.push({ name: `W${i + 1}`, apps, recs });
      }
    } else if (timeframe === 'monthly') {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(now.getMonth() - i);
        d.setDate(1); d.setHours(0, 0, 0, 0);
        const nextMonth = new Date(d);
        nextMonth.setMonth(d.getMonth() + 1);

        let apps = 0;
        let recs = 0;

        rawStats.apps.forEach(a => { if (new Date(a.created_at) >= d && new Date(a.created_at) < nextMonth) apps++; });
        rawStats.roadmaps.forEach(r => { if (new Date(r.created_at) >= d && new Date(r.created_at) < nextMonth) { apps++; if (r.target_role?.includes('⭐')) recs++; } });
        rawStats.convos.forEach(c => { if (new Date(c.created_at) >= d && new Date(c.created_at) < nextMonth) apps++; });

        data.push({ name: monthNames[d.getMonth()], apps, recs });
      }
    } else if (timeframe === 'yearly') {
      for (let i = 2; i >= 0; i--) {
        const year = now.getFullYear() - i;
        const start = new Date(year, 0, 1);
        const end = new Date(year + 1, 0, 1);

        let apps = 0;
        let recs = 0;

        rawStats.apps.forEach(a => { if (new Date(a.created_at) >= start && new Date(a.created_at) < end) apps++; });
        rawStats.roadmaps.forEach(r => { if (new Date(r.created_at) >= start && new Date(r.created_at) < end) { apps++; if (r.target_role?.includes('⭐')) recs++; } });
        rawStats.convos.forEach(c => { if (new Date(c.created_at) >= start && new Date(c.created_at) < end) apps++; });

        data.push({ name: year.toString(), apps, recs });
      }
    }
    setTrendData(data);
  };

  const statCards = [
    { label: 'Total Users', value: loading ? '...' : stats.users, icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Total Agency Flashes Sent', value: loading ? '...' : stats.recommendations, icon: Target, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'AI Coach Engagements', value: loading ? '...' : stats.conversations, icon: Brain, color: 'text-violet-400', bg: 'bg-violet-400/10' },
    { label: 'Active Job Opportunities', value: loading ? '...' : stats.activeJobs, icon: Briefcase, color: 'text-fuchsia-400', bg: 'bg-fuchsia-400/10' },
  ];

  return (
    <div className="space-y-6 pb-16 w-full">
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
            <option className="text-gray-900">Last 30 Days</option>
            <option className="text-gray-900">Last 3 Months</option>
            <option className="text-gray-900">Last 6 Months</option>
            <option className="text-gray-900">All Time</option>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-600/20 to-violet-600/20 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Daily Applications</p>
              <h3 className="text-4xl font-black text-white">{loading ? '...' : stats.dailyApplications}</h3>
            </div>
            <div className="p-4 bg-white/5 rounded-xl text-blue-400 group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8" />
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl -mr-16 -mt-16"></div>
        </div>
        <div className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Total Applications</p>
              <h3 className="text-4xl font-black text-white">{loading ? '...' : stats.totalApplications}</h3>
            </div>
            <div className="p-4 bg-white/5 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform">
              <Target className="w-8 h-8" />
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl -mr-16 -mt-16"></div>
        </div>
      </div>

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

        <div className="flex flex-col xl:flex-row gap-8 items-start">
          <div className="flex-1 bg-[#111524] border border-white/5 rounded-3xl p-8 min-h-[450px] flex flex-col w-full relative overflow-hidden group">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 relative z-10">
              <div>
                <h2 className="text-xl font-bold text-white mb-1 uppercase tracking-widest">ACTIVITY TREND</h2>
                <p className="text-xs text-gray-500 font-medium">User Applications</p>
              </div>

              <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 shrink-0">
                {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeframe(t)}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${timeframe === t
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-gray-500 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Applications</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Recs</span>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full relative z-10 min-h-[350px] flex items-center justify-center bg-white/[0.01] rounded-2xl overflow-visible">
              <AreaChart
                width={800}
                height={350}
                data={trendData.length > 0 ? trendData : [{ name: '...', apps: 0, recs: 0 }]}
                margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRecs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#4b5563', fontSize: 10, fontStyle: 'italic', fontWeight: 600 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#4b5563', fontSize: 10, fontStyle: 'italic', fontWeight: 600 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)' }}
                  itemStyle={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}
                  labelStyle={{ color: '#9ca3af', marginBottom: '4px', fontSize: '10px', fontWeight: 600 }}
                />
                <Area
                  type="monotone"
                  dataKey="apps"
                  name="Applications"
                  stroke="#3b82f6"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorApps)"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="recs"
                  name="Recommendations"
                  stroke="#10b981"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorRecs)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </div>
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl opacity-50"></div>
          </div>

          <div className="w-full xl:w-[450px] bg-[#161a29] border border-white/10 rounded-3xl p-8 h-full flex flex-col shrink-0">
            <h3 className="text-xl font-bold text-white mb-1 uppercase tracking-widest">Recent Recommendations</h3>
            <p className="text-sm text-gray-500 font-medium mb-8">Latest career matches pushed to users</p>
            <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[400px]">
              {recentRecs.length > 0 ? (
                <div className="space-y-4 pr-2">
                  {recentRecs.map((rec, i) => (
                    <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-bold text-blue-400 truncate flex-1">
                          {rec.target_role?.split(': ')[1] || rec.target_role || 'Unknown Role'}
                        </p>
                        <span className="text-[10px] text-gray-600 font-mono">{new Date(rec.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-gray-300">
                        Candidate: <span className="text-white font-medium">{rec.profiles?.first_name || 'User'} {rec.profiles?.last_name || ''}</span>
                      </p>
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => navigate(`/dashboard/users/${rec.user_id}`)}
                          className="text-[10px] uppercase font-bold tracking-widest text-violet-400 hover:text-violet-300"
                        >
                          View Profile →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500 text-sm">No recent job recommendations pushed to users.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
