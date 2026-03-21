import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2, ShieldCheck, ArrowLeft, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../lib/config';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [forgotMode, setForgotMode] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('adminToken', data.token);
                localStorage.setItem('adminUser', JSON.stringify(data.admin));
                navigate('/');
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('Connection error. Is the server running?');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMsg('');

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMsg('Recovery link sent to your email!');
                setTimeout(() => setForgotMode(false), 3000);
            } else {
                setError(data.error || 'Failed to send recovery link');
            }
        } catch (err) {
            setError('Connection error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#030712] flex items-center justify-center p-4 relative overflow-hidden font-sans">
             {/* Futuristic Background */}
             <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <motion.div 
                    animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] bg-brand-600/20 rounded-full blur-[120px]" 
                />
                <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
            </div>

            <div className="w-full max-w-md z-10">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center mb-8"
                >
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-brand-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center shadow-2xl mb-4 rotate-3 transform transition-all hover:rotate-0 hover:scale-105 border border-white/10">
                             <ShieldCheck className="text-brand-400" size={40} />
                        </div>
                    </div>
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br from-white via-slate-200 to-slate-500 tracking-tighter">
                        RealDream Admin
                    </h1>
                    <p className="text-slate-500 mt-2 font-bold text-[10px] uppercase tracking-[0.4em]">Integrated Admin Portal</p>
                </motion.div>

                <motion.div 
                    layout
                    className="glass-card p-8 shadow-2xl shadow-black/60 border border-white/5 backdrop-blur-2xl relative"
                >
                    <AnimatePresence mode="wait">
                        {!forgotMode ? (
                            <motion.form 
                                key="login"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onSubmit={handleLogin} 
                                className="space-y-6"
                            >
                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase p-3 rounded-xl flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Admin Email</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-brand-400 transition-colors" size={16} />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="admin@nexus.io"
                                            className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500/30 focus:bg-slate-900 transition-all font-medium text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Password</label>
                                        <button 
                                            type="button"
                                            onClick={() => setForgotMode(true)}
                                            className="text-[10px] text-brand-500 hover:text-brand-400 font-black uppercase tracking-widest transition-colors"
                                        >
                                            Forgot Password?
                                        </button>
                                    </div>
                                    <div className="relative group">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-brand-400 transition-colors" size={16} />
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500/30 focus:bg-slate-900 transition-all font-medium text-sm"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-brand-600 hover:bg-brand-500 text-white font-black py-3.5 rounded-xl shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2 uppercase tracking-[0.2em] text-xs disabled:opacity-50 group border border-brand-400/20"
                                >
                                    {loading ? (
                                        <Loader2 className="animate-spin" size={18} />
                                    ) : (
                                        <>
                                            Sign In
                                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                                        </>
                                    )}
                                </button>
                            </motion.form>
                        ) : (
                            <motion.form 
                                key="forgot"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleForgotPassword} 
                                className="space-y-6"
                            >
                                <div className="space-y-2">
                                    <button 
                                        type="button" 
                                        onClick={() => setForgotMode(false)}
                                        className="text-slate-500 hover:text-white flex items-center gap-2 text-[10px] font-bold uppercase transition-colors"
                                    >
                                        <ArrowLeft size={14} /> Back to Terminal
                                    </button>
                                    <h2 className="text-xl font-bold text-white tracking-tight">Recover Access</h2>
                                    <p className="text-slate-400 text-xs font-medium">System will dispatch a neural reset token to your ID.</p>
                                </div>

                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold p-3 rounded-xl">
                                        {error}
                                    </div>
                                )}

                                {successMsg && (
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold p-3 rounded-xl flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        {successMsg}
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Confirmation ID</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-brand-400 transition-colors" size={16} />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="admin@nexus.io"
                                            className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-medium text-sm"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !!successMsg}
                                    className="w-full bg-brand-600 hover:bg-brand-500 text-white font-black py-3.5 rounded-xl shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2 uppercase tracking-[0.2em] text-xs disabled:opacity-50"
                                >
                                    {loading ? (
                                        <Loader2 className="animate-spin" size={18} />
                                    ) : (
                                        <>
                                            Dispatch Token
                                            <Send size={14} />
                                        </>
                                    )}
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </motion.div>

                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-center text-slate-700 text-[9px] mt-8 font-black uppercase tracking-[0.3em]"
                >
                    &copy; 2026 RealDream Admin &bull; Secure Access Layer 0
                </motion.p>
            </div>
        </div>
    );
}
