import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { UsersManagement } from './pages/UsersManagement';
import { TableViewer } from './pages/TableViewer';
import { DashboardOverview } from './pages/DashboardOverview';
import { UserProfile } from './pages/UserProfile';
import { RowViewer } from './pages/RowViewer';
import { JobBoard } from './pages/JobBoard';
import { LearningModules } from './pages/LearningModules';
import { Applications } from './pages/Applications';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      
      
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardOverview />} />
          <Route path="/dashboard/jobs" element={<JobBoard />} />
          <Route path="/dashboard/applications" element={<Applications />} />
          <Route path="/dashboard/users" element={<UsersManagement />} />
          <Route path="/dashboard/users/:id" element={<UserProfile />} />
          <Route path="/dashboard/learning-modules" element={<LearningModules />} />
          <Route path="/dashboard/tables/:tableName" element={<TableViewer />} />
          <Route path="/dashboard/tables/:tableName/:id" element={<RowViewer />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard/users" replace />} />
    </Routes>
  );
}

export default App;
