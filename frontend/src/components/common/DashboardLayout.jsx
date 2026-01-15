import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, LogOut, HelpCircle, ChevronDown, RefreshCw, Moon, Sun } from "lucide-react";

/**
 * Shared Dashboard Layout Component
 * Provides consistent sidebar navigation, header, and styling across all role pages
 */
function DashboardLayout({ 
  children, 
  user, 
  roleName, 
  roleLabel,
  menuItems = [], 
  activeMenu, 
  setActiveMenu,
  onRefresh,
  loading = false
}) {
  const navigate = useNavigate();
  
  // Initialize theme from localStorage or system preference
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const [theme, setTheme] = useState(getInitialTheme);

  // Apply theme on mount and when theme changes
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Listen for storage changes from other tabs/pages
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'theme' && e.newValue) {
        setTheme(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // Get initials from username or name
  const getInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user?.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const getDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.username || "User";
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col sticky top-0 h-screen">
        {/* Logo/Brand Section */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold text-primary tracking-tight">UTVDS</p>
              <p className="text-[10px] text-muted-foreground truncate">Traffic Violation System</p>
            </div>
          </div>
        </div>
        
        {/* User Profile Section */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold flex-shrink-0">
              {getInitials()}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{roleLabel}</p>
              <p className="text-sm font-medium truncate">{getDisplayName()}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <p className="text-[10px] font-bold text-muted-foreground px-3 mb-3 uppercase tracking-wider">Navigation</p>
          <div className="space-y-1">
            {menuItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setActiveMenu(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  activeMenu === item.key 
                    ? "bg-primary text-primary-foreground font-medium shadow-sm" 
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Footer Actions */}
        <div className="p-3 border-t border-border space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg transition-colors">
            <HelpCircle size={18}/> Help & Support
          </button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut size={18}/> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-10">
          <div>
            <h1 className="text-lg font-semibold capitalize">{activeMenu.replace(/-/g, " ")}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            {onRefresh && (
              <Button variant="ghost" size="icon" onClick={onRefresh} disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;
