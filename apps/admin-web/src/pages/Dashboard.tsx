import { Users, BookOpen, Handshake, Brain } from 'lucide-react';

export const Dashboard = () => {
  const stats = [
    { label: 'Active Students', value: '1,248', icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Career Paths Generated', value: '3,842', icon: Handshake, color: 'text-violet-400', bg: 'bg-violet-400/10' },
    { label: 'AI Mentorship Sessions', value: '8,921', icon: Brain, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
    { label: 'Universities Reached', value: '156', icon: BookOpen, color: 'text-fuchsia-400', bg: 'bg-fuchsia-400/10' },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Welcome Back</h1>
        <p className="text-gray-400">Here's an overview of the Enroute platform performance today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:bg-white/10 hover:shadow-lg hover:shadow-violet-500/10 hover:-translate-y-1">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              </div>
            </div>
            {/* Subtle glow effect on hover */}
            <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full ${stat.bg} opacity-0 blur-2xl transition-opacity group-hover:opacity-100`}></div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-6">Recent Activity Hub</h3>
          <div className="flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-xl bg-black/20">
            <div className="w-16 h-16 mb-4 rounded-full bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
              <Brain className="w-8 h-8 text-violet-400" />
            </div>
            <h4 className="text-white font-medium">No Recent Activity</h4>
            <p className="text-gray-500 text-sm mt-2 text-center max-w-sm">
              Activity from the mobile application (e.g. Dahlia AI interactions, matching events) will appear here in real-time.
            </p>
          </div>
        </div>
        
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-6">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-violet-600/20 border border-white/5 hover:border-violet-500/30 transition-all text-sm font-medium text-gray-300 hover:text-white flex items-center justify-between group">
              Post Announcement
              <span className="text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </button>
            <button className="w-full text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-blue-600/20 border border-white/5 hover:border-blue-500/30 transition-all text-sm font-medium text-gray-300 hover:text-white flex items-center justify-between group">
              Manage Mentors
              <span className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </button>
            <button className="w-full text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-fuchsia-600/20 border border-white/5 hover:border-fuchsia-500/30 transition-all text-sm font-medium text-gray-300 hover:text-white flex items-center justify-between group">
              View Analytics
              <span className="text-fuchsia-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
