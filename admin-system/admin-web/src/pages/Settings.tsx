import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Server, Database, Activity, ShieldAlert, Cpu, Lock, Send, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../lib/config';

export default function Settings() {
    const [loading, setLoading] = useState(true);
    const [health, setHealth] = useState<any>(null);
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    
    // Password state
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [passLoading, setPassLoading] = useState(false);
    const [passMessage, setPassMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchHealth();
        const interval = setInterval(fetchHealth, 30000); // Auto-refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const fetchHealth = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/system-health`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
                }
            });

            if (res.status === 401) {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
                window.location.href = '/login';
                return;
            }

            const data = await res.json();
            setHealth(data);
            setLoading(false);
        } catch (err) {
            console.error("Health fetch failed", err);
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            setPassMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        setPassLoading(true);
        setPassMessage({ type: '', text: '' });

        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
                },
                body: JSON.stringify({
                    currentPassword: passwords.current,
                    newPassword: passwords.new
                })
            });

            const data = await res.json();
            if (res.ok) {
                setPassMessage({ type: 'success', text: 'Password updated successfully!' });
                setPasswords({ current: '', new: '', confirm: '' });
            } else {
                setPassMessage({ type: 'error', text: data.error || 'Failed to update password' });
            }
        } catch (err) {
            setPassMessage({ type: 'error', text: 'Connection error' });
        } finally {
            setPassLoading(false);
        }
    };

    const toggleMaintenance = () => {
        if (confirm(`Are you sure you want to ${maintenanceMode ? 'disable' : 'enable'} Maintenance Mode? Users will ${maintenanceMode ? 'regain' : 'lose'} access.`)) {
            setMaintenanceMode(!maintenanceMode);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out h-full relative">
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 blur-[100px] -z-10" />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                     <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Core Configuration</span>
                    </div>
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-white to-slate-400 inline-block drop-shadow-sm">
                        Settings & Health
                    </h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* System Health Card */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-6 shadow-2xl flex flex-col lg:col-span-2 relative overflow-hidden group border border-white/5"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                         <Activity size={80} className="text-emerald-400" />
                    </div>

                    <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-800/50 relative z-10">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20 shadow-[0_0_15px_-5px_rgba(59,130,246,0.5)]">
                            <Activity size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-100">System Status</h2>
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Real-time infrastructure health</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="h-48 flex items-center justify-center text-slate-500 animate-pulse font-mono text-sm">
                            &gt; PINGING NEURAL NODES...
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-6 relative z-10">
                            {[
                                { label: 'Server Status', value: health?.status, icon: Server, color: 'emerald', sub: 'Main API Layer' },
                                { label: 'Database', value: health?.database?.latency, icon: Database, color: 'emerald', sub: 'Neon PostgreSQL' },
                                { label: 'CPU Usage', value: `${health?.server?.load}%`, icon: Cpu, color: 'brand', sub: 'Processing Load' },
                                { label: 'Uptime', value: health?.server?.uptime, icon: Activity, color: 'blue', sub: 'Total Run Time' }
                            ].map((stat, i) => (
                                <motion.div 
                                    key={i}
                                    whileHover={{ y: -2 }}
                                    className="p-4 bg-white/5 rounded-2xl border border-white/5 transition-all hover:bg-white/10"
                                >
                                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-3">
                                        <stat.icon size={12} className={`text-${stat.color}-400`} /> {stat.label}
                                    </div>
                                    <div className={`text-2xl font-black text-${stat.color}-400 capitalize drop-shadow-[0_0_8px_rgba(139,92,246,0.3)]`}>
                                        {stat.value}
                                    </div>
                                    <div className="text-[9px] text-slate-600 mt-1 font-medium italic">{stat.sub}</div>
                                </motion.div>
                            ))}
                            
                            <div className="col-span-2 p-4 bg-slate-900/50 rounded-2xl border border-white/5 mt-2">
                                <div className="flex justify-between items-center mb-2">
                                     <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Memory Allocation</span>
                                     <span className="text-xs font-mono text-slate-300">{health?.server?.memory?.used} / {health?.server?.memory?.total}</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: health?.server?.memory?.percentage || '0%' }}
                                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.5)]"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Security and Password */}
                <div className="space-y-8">
                     <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass-card p-6 border border-white/5 shadow-2xl relative overflow-hidden"
                     >
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800/50">
                            <div className="p-2 bg-brand-500/10 rounded-lg text-brand-400 border border-brand-500/20">
                                <Lock size={20} />
                            </div>
                            <h2 className="text-lg font-bold text-slate-200">Security</h2>
                        </div>

                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Current Password</label>
                                <input 
                                    type="password" 
                                    value={passwords.current}
                                    onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500/50 transition-all font-mono"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">New Password</label>
                                <input 
                                    type="password" 
                                    value={passwords.new}
                                    onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500/50 transition-all font-mono"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Confirm Secret</label>
                                <input 
                                    type="password" 
                                    value={passwords.confirm}
                                    onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500/50 transition-all font-mono"
                                    required
                                />
                            </div>

                            {passMessage.text && (
                                <div className={`text-[10px] font-bold p-3 rounded-lg border flex items-center gap-2 ${passMessage.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                                    {passMessage.type === 'success' ? <CheckCircle size={14} /> : <ShieldAlert size={14} />}
                                    {passMessage.text}
                                </div>
                            )}

                            <button 
                                disabled={passLoading}
                                className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-brand-600/20 disabled:opacity-50 group flex items-center justify-center gap-2"
                            >
                                {passLoading ? 'Updating Password...' : 'Change Password'}
                                <Lock size={14} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </form>
                     </motion.div>

                    <div className="glass-card p-6 shadow-xl border border-white/5 flex flex-col relative overflow-hidden group">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800/50">
                            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
                                <SettingsIcon size={20} />
                            </div>
                            <h2 className="text-lg font-bold text-slate-200">System Control</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-slate-200 font-bold text-xs uppercase tracking-wide">Stealth Mode</h3>
                                    <p className="text-slate-500 text-[9px] mt-1 max-w-[180px]">Disables all public uplinks for maintenance.</p>
                                </div>
                                <button
                                    onClick={toggleMaintenance}
                                    className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${maintenanceMode ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-slate-700'}`}
                                >
                                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${maintenanceMode ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            <div className="pt-6 border-t border-slate-800/50 space-y-3">
                                <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl transition-all border border-indigo-500/20 text-[10px] font-black uppercase tracking-widest">
                                    <Send size={14} /> Send Alert to Users
                                </button>
                                <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all border border-red-500/20 text-[10px] font-black uppercase tracking-widest">
                                    <ShieldAlert size={14} /> Emergency Server Kill
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
