
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Shield, LogIn, User, Search, FileText, Home, DatabaseIcon } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const Navigation: React.FC = () => {
  const { currentUser, signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 w-full sm:w-fit sm:h-full bg-background border-t sm:border-r border-border sm:top-0 z-10">
      <div className="flex sm:flex-col justify-around sm:justify-start items-center h-full py-2 sm:py-6 px-2">
        <div className="hidden sm:flex items-center justify-center mb-8">
          <Shield className="h-8 w-8 text-scamshield-blue" />
          <span className="ml-2 text-xl font-bold text-scamshield-blue">ScamShield</span>
        </div>
        
        <Link to="/" className="flex flex-col items-center sm:w-full sm:px-4 sm:py-3 rounded-lg transition-colors hover:bg-accent group">
          <Home className={`h-6 w-6 ${isActive('/') ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
          <span className={`text-xs mt-1 sm:text-sm ${isActive('/') ? 'text-primary font-medium' : 'text-muted-foreground group-hover:text-primary'}`}>Home</span>
        </Link>
        
        <Link to="/check" className="flex flex-col items-center sm:w-full sm:px-4 sm:py-3 rounded-lg transition-colors hover:bg-accent group">
          <Search className={`h-6 w-6 ${isActive('/check') ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
          <span className={`text-xs mt-1 sm:text-sm ${isActive('/check') ? 'text-primary font-medium' : 'text-muted-foreground group-hover:text-primary'}`}>Check</span>
        </Link>
        
        <Link to="/report" className="flex flex-col items-center sm:w-full sm:px-4 sm:py-3 rounded-lg transition-colors hover:bg-accent group">
          <FileText className={`h-6 w-6 ${isActive('/report') ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
          <span className={`text-xs mt-1 sm:text-sm ${isActive('/report') ? 'text-primary font-medium' : 'text-muted-foreground group-hover:text-primary'}`}>Report</span>
        </Link>
        
        <Link to="/explorer" className="flex flex-col items-center sm:w-full sm:px-4 sm:py-3 rounded-lg transition-colors hover:bg-accent group">
          <DatabaseIcon className={`h-6 w-6 ${isActive('/explorer') ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
          <span className={`text-xs mt-1 sm:text-sm ${isActive('/explorer') ? 'text-primary font-medium' : 'text-muted-foreground group-hover:text-primary'}`}>Explorer</span>
        </Link>
        
        {currentUser ? (
          <Link to="/profile" className="flex flex-col items-center sm:w-full sm:px-4 sm:py-3 rounded-lg transition-colors hover:bg-accent group">
            <User className={`h-6 w-6 ${isActive('/profile') ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
            <span className={`text-xs mt-1 sm:text-sm ${isActive('/profile') ? 'text-primary font-medium' : 'text-muted-foreground group-hover:text-primary'}`}>Profile</span>
          </Link>
        ) : (
          <Link to="/login" className="flex flex-col items-center sm:w-full sm:px-4 sm:py-3 rounded-lg transition-colors hover:bg-accent group">
            <LogIn className={`h-6 w-6 ${isActive('/login') ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
            <span className={`text-xs mt-1 sm:text-sm ${isActive('/login') ? 'text-primary font-medium' : 'text-muted-foreground group-hover:text-primary'}`}>Login</span>
          </Link>
        )}

        <div className="hidden sm:block mt-auto mb-2">
          <ThemeToggle />
        </div>
        
        {currentUser && (
          <div className="hidden sm:block sm:mb-4 sm:w-full px-2">
            <Button 
              onClick={() => signOut()} 
              variant="outline" 
              className="w-full text-sm"
            >
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navigation;
