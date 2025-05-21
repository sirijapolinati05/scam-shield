
import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button 
      variant="outline" 
      size="icon" 
      onClick={toggleTheme} 
      className={`rounded-full w-9 h-9 transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700 hover:text-yellow-300 border-slate-700' 
          : 'bg-blue-50 text-blue-900 hover:bg-blue-100 border-blue-200'
      }`}
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  );
};

export default ThemeToggle;
