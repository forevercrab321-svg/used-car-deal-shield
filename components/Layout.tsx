import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, User as UserIcon, Menu, X, History } from 'lucide-react';
import { apiService } from '../services/apiService';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await apiService.getCurrentUser();
      setUser(currentUser);
    };
    loadUser();
  }, [location.pathname]); // Reload user on nav change

  const isLanding = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-inter">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <ShieldCheck size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Deal Shield</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {!isLanding && (
              <Link to="/upload" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                New Scan
              </Link>
            )}

            {user ? (
              <>
                <Link to="/history" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1">
                  <History size={16} />
                  History
                </Link>
                <Link to="/account" className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-4 py-1.5 text-sm font-medium text-slate-900 hover:bg-slate-200 transition-all">
                  <UserIcon size={16} />
                  <span>{user.name || 'Account'}</span>
                </Link>
              </>
            ) : (
              <Link to="/account" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                Log In
              </Link>
            )}
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-slate-600"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-4 shadow-lg">
            <Link to="/upload" onClick={() => setIsMenuOpen(false)} className="block text-base font-medium text-slate-600">Scan Deal</Link>
            <Link to="/history" onClick={() => setIsMenuOpen(false)} className="block text-base font-medium text-slate-600">History</Link>
            <Link to="/account" onClick={() => setIsMenuOpen(false)} className="block text-base font-medium text-slate-600">Account</Link>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto">
        {children}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-white">
                <ShieldCheck size={14} />
              </div>
              <span className="text-sm font-semibold text-slate-700">Deal Shield</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <Link to="/upload" className="hover:text-indigo-600 transition-colors">Scan Deal</Link>
              <Link to="/history" className="hover:text-indigo-600 transition-colors">History</Link>
              <Link to="/account" className="hover:text-indigo-600 transition-colors">Account</Link>
            </div>
            <p className="text-xs text-slate-400">© 2026 Deal Shield. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};