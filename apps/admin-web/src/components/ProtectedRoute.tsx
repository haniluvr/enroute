import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute = () => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0f1c]">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Determine if user has appropriate permissions
  const isAdminOrMentor = role === 'admin' || role === 'mentor' || user.email === 'admin@gmail.com';

  if (!isAdminOrMentor) {
    // If authenticated but wrong role, log them out or show unauthorized. Let's redirect to login for simplicity.
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
