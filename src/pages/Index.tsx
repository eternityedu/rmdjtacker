import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Landing from './Landing';
import { Layout } from '@/components/layout/Layout';
import { Loader2 } from 'lucide-react';

export default function Index() {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    if (userRole === 'admin') return <Navigate to="/admin" replace />;
    if (userRole === 'house_owner') return <Navigate to="/owner" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Layout>
      <Landing />
    </Layout>
  );
}
