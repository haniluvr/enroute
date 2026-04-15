import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { RefreshCw } from 'lucide-react';

export const UsersManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch all profiles from Supabase
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
          <button className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors shadow-lg shadow-blue-500/20">
            Export List
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
                      <button 
                        onClick={() => navigate(`/dashboard/users/${user.id}`)}
                        className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1 group"
                      >
                        Manage <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </button>
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
    </div>
  );
};
