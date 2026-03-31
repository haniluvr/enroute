import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Database, LogOut, Settings, MessageSquare, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';

export const DashboardLayout = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  
  useEffect(() => {
    if (user && user.email !== 'admin@gmail.com') {
      console.warn("Unauthorized Access: Redirecting non-admin user.");
      handleSignOut();
    }
  }, [user]);

  const tableModules = [
    { path: '/dashboard/tables/learning_paths', label: 'learning_paths', sub: 'Structured educational journeys', icon: Database },
    { path: '/dashboard/learning-modules', label: 'learning_modules', sub: 'Individual lesson items and videos', icon: Database },
    { path: '/dashboard/tables/user_settings', label: 'user_settings', sub: 'Global app preferences and flags', icon: Settings },
    { path: '/dashboard/tables/conversations', label: 'conversations', sub: 'AI coaching session headers', icon: MessageSquare },
    { path: '/dashboard/tables/messages', label: 'messages', sub: 'General system messages', icon: MessageCircle },
  ];

  return (
    <div className="flex h-screen h-[100dvh] overflow-hidden bg-[#0a0f1c] font-sans text-white">
      <aside className="w-[320px] border-r border-white/10 bg-[#0d1326] flex flex-col shrink-0">
        <div className="flex h-20 items-center px-6 border-b border-white/10 shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-blue-500 shadow-lg shadow-violet-500/20">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <span className="ml-3 text-lg font-bold tracking-wide">Enroute<span className="text-violet-500">Agency</span></span>
        </div>

        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-8">
          
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-gray-500 mb-3 tracking-widest uppercase px-3">Core</h3>
            
            <NavLink
                to="/dashboard"
                end
                className={({ isActive }) =>
                  `flex items-center gap-4 rounded-2xl px-5 py-4 transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                      : 'text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white border border-white/5'
                  }`
                }
              >
                <LayoutDashboard className="h-5 w-5" />
                <div className="flex flex-col">
                  <span className="font-bold text-sm tracking-wide">Overview</span>
                  <span className="text-xs opacity-70 mt-0.5">App analytics</span>
                </div>
            </NavLink>

            <NavLink
                to="/dashboard/users"
                className={({ isActive }) =>
                  `flex items-center gap-4 rounded-2xl px-5 py-4 transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                      : 'text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white border border-white/5'
                  }`
                }
              >
                <Users className="h-5 w-5" />
                <div className="flex flex-col">
                  <span className="font-bold text-sm tracking-wide">Users</span>
                  <span className="text-xs opacity-70 mt-0.5">Manage user profiles</span>
                </div>
            </NavLink>

            <NavLink
                to="/dashboard/jobs"
                className={({ isActive }) =>
                  `flex items-center gap-4 rounded-2xl px-5 py-4 transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                      : 'text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white border border-white/5'
                  }`
                }
              >
                <Database className="h-5 w-5" />
                <div className="flex flex-col">
                  <span className="font-bold text-sm tracking-wide">Job Opportunities</span>
                  <span className="text-xs opacity-70 mt-0.5">Search open jobs</span>
                </div>
            </NavLink>
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-500 mb-3 tracking-widest uppercase px-3">Table Modules</h3>
            <div className="space-y-3">
              {tableModules.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-4 rounded-2xl px-5 py-4 transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                        : 'text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white border border-white/5'
                    }`
                  }
                >
                  <div className="p-2 rounded-full bg-white/10">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-bold text-sm tracking-wide">{item.label}</span>
                    <span className={`text-xs mt-0.5 truncate ${location.pathname === item.path ? 'text-blue-100' : 'text-gray-500'}`}>
                      {item.sub}
                    </span>
                  </div>
                </NavLink>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full border-t border-white/10 p-4 bg-[#0d1326] shrink-0">
          <div className="mb-4 flex items-center gap-3 px-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 shadow-md">
              <span className="font-semibold text-white">{user?.email?.charAt(0).toUpperCase()}</span>
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-sm font-medium text-white">{user?.email}</p>
              <p className="truncate text-xs text-blue-400 font-medium">Head Recruiter</p>
            </div>
          </div>
          
          <button
            onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-500 bg-white/5 border border-red-500/10 transition-colors hover:bg-red-500/20 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-[#0a0f1c]">
        <div className="flex-1 overflow-auto p-8 relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
