
import React from 'react';
import Navigation from './Navigation';
import { useAuth } from '@/contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, requireAuth = false }) => {
  const { currentUser, loading } = useAuth();

  // If route requires authentication and user is not logged in
  if (requireAuth && !loading && !currentUser) {
    return (
      <div className="flex min-h-screen">
        <Navigation />
        <main className="flex-1 sm:ml-56 p-4 sm:p-8">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h2 className="text-xl font-semibold text-yellow-800">Authentication Required</h2>
              <p className="text-yellow-700">Please log in to access this feature.</p>
              <a href="/login" className="mt-2 inline-block text-blue-600 hover:underline">Go to Login</a>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="flex-1 sm:ml-56 p-4 sm:p-8 pb-24 sm:pb-8">
        <div className="max-w-4xl mx-auto space-y-4">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
