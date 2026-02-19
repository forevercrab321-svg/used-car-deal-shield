import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '../components/Button';
import { apiService } from '../services/apiService';
import { supabase } from '../lib/supabase';

export const AdminLogin: React.FC = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const data = await apiService.adminLogin(password);

            // Set session manually for Supabase client
            const { error: sessionError } = await supabase.auth.setSession({
                access_token: data.token,
                refresh_token: data.refreshToken
            });

            if (sessionError) throw sessionError;

            navigate('/history');
        } catch (err: any) {
            console.error('Admin login failed:', err);
            setError(err.message || 'Invalid password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-200">
                        <Shield className="text-white" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Admin Access</h2>
                    <p className="text-slate-500">Enter the master password to unlock all features.</p>
                </div>

                <form onSubmit={handleLogin} className="p-8 pt-0 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Master Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-sm">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <Button fullWidth size="lg" isLoading={isLoading} icon={ArrowRight}>
                        Unlock Dashboard
                    </Button>
                </form>

                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                    <button onClick={() => navigate('/')} className="text-sm text-slate-500 hover:text-indigo-600 font-medium">
                        Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
};
