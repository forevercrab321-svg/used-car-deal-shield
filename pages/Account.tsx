import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon } from 'lucide-react';
import { apiService } from '../services/apiService';
import { User } from '../types';
import { Button } from '../components/Button';

export const Account: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const u = await apiService.getCurrentUser();
      setUser(u);
    };
    checkUser();
  }, []);

  const [message, setMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setMessage(null);
    try {
      await apiService.login(email);
      setMessage("Magic link sent! Check your email to log in.");
    } catch (err) {
      console.error(err);
      alert("Login failed. Please try again.");
    }
    setIsLoading(false);
  };

  const handleLogout = () => {
    apiService.logout();
    setUser(null);
    navigate('/');
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome Back</h1>
          <p className="text-slate-500 mb-8">Enter your email to access your saved deals.</p>

          {message && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl border border-green-100 text-sm font-medium">
              {message}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                placeholder="you@example.com"
              />
            </div>
            <Button fullWidth isLoading={isLoading} type="submit">
              Send Login Link
            </Button>
            <p className="text-xs text-center text-slate-400">
              We'll email you a magic link to sign in instantly.
            </p>
          </form>

        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
            <UserIcon size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
            <p className="text-slate-500">{user.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <Button variant="outline" fullWidth onClick={() => navigate('/history')}>
            View Scan History
          </Button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 py-3 rounded-xl transition-colors font-medium"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};