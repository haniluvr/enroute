import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Megaphone, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const DashboardLayout = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { path: '/dashboard/students', label: 'Students', icon: Users },
    { path: '/dashboard/announcements', label: 'Announcements', icon: Megaphone },
  ];

  return (
    <div className="flex min-h-screen bg-[#0a0f1c] font-sans text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-[#0d1326]">
        <div className="flex h-20 items-center px-6 border-b border-white/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-blue-500 shadow-lg shadow-violet-500/20">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <span className="ml-3 text-lg font-bold tracking-wide">Enroute<span className="text-violet-500">Admin</span></span>
        </div>

        <div className="p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="absolute bottom-0 w-64 border-t border-white/10 p-4 bg-[#0d1326]">
          <div className="mb-4 flex items-center gap-3 px-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
              <span className="font-semibold text-violet-400">{user?.email?.charAt(0).toUpperCase()}</span>
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-sm font-medium text-white">{user?.email}</p>
              <p className="truncate text-xs text-gray-500">Administrator</p>
            </div>
          </div>
          
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
         {/* Background glow for content area */}
        <div className="absolute top-0 right-0 -z-10 h-[300px] w-[500px] rounded-full bg-violet-600/10 blur-[120px]"></div>
        
        {/* Header */}
        <header className="flex h-20 items-center justify-between border-b border-white/10 px-8 bg-[#0a0f1c]/80 backdrop-blur-md sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-white/90">Dashboard</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">Role: <span className="text-violet-400 font-medium">Admin / Mentor</span></span>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
