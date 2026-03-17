import React, { useEffect, useState } from 'react';
import { Users, MoonStar, Zap, Award, Activity, TrendingUp, Cpu, Server, Database } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';

interface Stats {
    totalUsers: number;
    activeDreams: number;
    completedTasks: number;
    totalCoinsAwarded: number;
}

interface Health {
    status: string;
    server: {
        uptime: string;
        load: number;
        memory: { used: string; total: string; percentage: string };
    };
    database: { status: string; latency: string };
}

export default function Dashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [health, setHealth] = useState<Health | null>(null);
    const [loading, setLoading] = useState(true);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 25, stiffness: 150 };
    const glowX = useSpring(mouseX, springConfig);
    const glowY = useSpring(mouseY, springConfig);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX - 250);
            mouseY.set(e.clientY - 250);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [mouseX, mouseY]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const headers = { 'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}` };
                
                const [statsRes, healthRes] = await Promise.all([
                    fetch('http://localhost:5001/api/stats', { headers }),
                    fetch('http://localhost:5001/api/admin/system-health', { headers })
                ]);

                const statsData = await statsRes.json();
                const healthData = await healthRes.json();

                setStats(statsData);
                setHealth(healthData);
                setLoading(false);
            } catch (err) {
                console.error("Dashboard sync failed", err);
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000); // 30s auto-sync
        return () => clearInterval(interval);
    }, []);

    const KpiCard = ({ title, value, icon: Icon, trend, color }: { title: string, value: string | number, icon: React.ElementType, trend: string, color: string }) => (
        <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="relative"
        >
            <div className="glass-card p-6 h-full flex flex-col justify-between group cursor-default relative z-10 overflow-hidden border border-white/5">
                <div className={`absolute -right-10 -top-10 w-32 h-32 bg-${color}-500/5 blur-[80px] group-hover:bg-${color}-500/15 transition-all duration-700`} />
                
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] mb-3">{title}</h3>
                        <p className="text-4xl font-black text-slate-100 tracking-tighter group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-brand-400 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                            {value}
                        </p>
                    </div>
                    <div className={`p-3 bg-${color}-500/10 rounded-2xl border border-${color}-500/20 group-hover:shadow-[0_0_20px_-5px_rgba(139,92,246,0.3)] transition-all duration-300`}>
                        <Icon size={22} className={`text-${color}-400`} />
                    </div>
                </div>
                
                <div className="mt-8 flex items-center justify-between">
                    <div className="flex items-center text-[10px] space-x-2">
                        <span className={`text-${color}-400 bg-${color}-400/5 px-2 py-1 rounded-md font-black flex items-center gap-1 border border-${color}-400/10`}>
                           <TrendingUp size={10} /> {trend}
                        </span>
                        <span className="text-slate-600 font-bold uppercase tracking-tighter">Synced</span>
                    </div>
                    <div className="h-1 w-16 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '75%' }}
                            transition={{ duration: 1.5, delay: 0.5 }}
                            className={`h-full bg-${color}-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]`} 
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="relative min-h-full space-y-10">
            {/* Interactive Cursor Glow */}
            <motion.div 
                className="fixed w-[500px] h-[500px] rounded-full pointer-events-none -z-10 opacity-30"
                style={{
                    left: glowX,
                    top: glowY,
                    background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
                }}
            />

            {/* Ambient Background Pulse */}
            <motion.div 
                animate={{ 
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.05, 1]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="fixed inset-0 pointer-events-none -z-20 bg-gradient-to-tr from-brand-900/10 via-transparent to-indigo-900/10"
            />
            
            <div className="absolute top-0 right-0 w-full h-[500px] bg-gradient-to-b from-brand-600/5 to-transparent blur-[120px] -z-10" />

            {/* Health Strip */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full bg-slate-900 shadow-2xl rounded-2xl border border-white/5 p-4 flex flex-wrap gap-8 items-center justify-between backdrop-blur-md relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-50" />
                
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                         <div className="relative">
                            <Activity size={16} className="text-emerald-400 animate-pulse" />
                            <div className="absolute inset-0 bg-emerald-400 blur-md opacity-20" />
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest leading-none mb-1">System Pulse</span>
                            <span className="text-xs font-black text-emerald-400 uppercase tracking-tighter">{health?.status || 'Active Syncing'}</span>
                         </div>
                    </div>
                    <div className="h-8 w-[1px] bg-white/5 hidden md:block" />
                    <div className="hidden md:flex items-center gap-3">
                        <Cpu size={14} className="text-slate-600" />
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase text-slate-600 tracking-widest leading-none mb-1">Server Load</span>
                            <span className="text-xs font-black text-slate-200">{health?.server?.load || '0.00'}%</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3">
                        <Database size={14} className="text-slate-600" />
                        <div className="flex flex-col text-right">
                            <span className="text-[9px] font-black uppercase text-slate-600 tracking-widest leading-none mb-1">DB Latency</span>
                            <span className="text-xs font-black text-indigo-400 font-mono tracking-tighter">{health?.database?.latency || '---'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Server size={14} className="text-slate-600" />
                        <div className="flex flex-col text-right">
                            <span className="text-[9px] font-black uppercase text-slate-600 tracking-widest leading-none mb-1">Uptime Stream</span>
                            <span className="text-xs font-black text-slate-200 font-mono tracking-tighter">{health?.server?.uptime || 'Updating...'}</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <h1 className="text-6xl font-black bg-clip-text text-transparent bg-gradient-to-br from-white via-slate-100 to-indigo-400 tracking-tighter drop-shadow-2xl">
                        RealDream Admin
                    </h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.5em] mt-3">
                        Total App Control &bull; v3.0 Interactive
                    </p>
                </motion.div>

                <div className="flex gap-4">
                    <button className="bg-brand-600 hover:bg-brand-500 text-white font-black py-2.5 px-6 rounded-xl transition-all shadow-xl shadow-brand-600/20 text-[10px] uppercase tracking-widest border border-brand-400/20 active:scale-95">
                        Export Report
                    </button>
                    <button className="bg-white/5 hover:bg-white/10 text-slate-300 font-black py-2.5 px-6 rounded-xl transition-all text-[10px] uppercase tracking-widest border border-white/5">
                        Filters
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AnimatePresence mode="wait">
                    {loading ? (
                         [1,2,3,4].map(i => (
                            <div key={i} className="glass-card p-10 h-44 animate-pulse bg-white/[0.02] border border-white/5" />
                         ))
                    ) : (
                        <>
                            <KpiCard title="Total Users" value={stats?.totalUsers?.toLocaleString() || "0"} icon={Users} trend="+12.5%" color="blue" />
                            <KpiCard title="Active Dreams" value={stats?.activeDreams?.toLocaleString() || "0"} icon={MoonStar} trend="+8.2%" color="indigo" />
                            <KpiCard title="Goals Met" value={stats?.completedTasks?.toLocaleString() || "0"} icon={Zap} trend="+24.1%" color="brand" />
                            <KpiCard title="Total Coins" value={stats?.totalCoinsAwarded?.toLocaleString() || "0"} icon={Award} trend="+4.9%" color="amber" />
                        </>
                    )}
                </AnimatePresence>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2 glass-card p-8 min-h-[450px] relative group border border-white/5 overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Activity size={140} className="text-brand-500" />
                    </div>
                    <div className="relative z-10 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-2xl font-black text-slate-100 tracking-tight">System Performance</h3>
                                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1">Real-time status</p>
                            </div>
                        </div>
                        <div className="flex-1 flex items-center justify-center border border-white/5 rounded-3xl bg-black/10 relative overflow-hidden">
                            <div className="absolute inset-0 opacity-10 pointer-events-none">
                                <motion.div 
                                    animate={{ 
                                        x: ['-100%', '100%']
                                    }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    className="w-full h-full bg-gradient-to-r from-transparent via-brand-500 to-transparent" 
                                />
                            </div>
                            <div className="text-center space-y-4 relative z-10">
                                <Activity size={40} className="text-brand-500 mx-auto animate-pulse" />
                                <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.3em]">Synaptic Engine Optimizing...</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="glass-card p-8 border border-white/5 flex flex-col relative"
                >
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-slate-100 tracking-tight">Recent Activity</h3>
                        <Activity size={16} className="text-brand-500 animate-pulse" />
                    </div>
                    <div className="space-y-4 flex-1">
                        {[
                            { user: 'K_Anderson', action: 'Construct Init', time: '1m ago', color: 'blue' },
                            { user: 'S_Vaughn', action: 'Resource Flow', time: '8m ago', color: 'amber' },
                            { user: 'T_Miller', action: 'Identity Sync', time: '45m ago', color: 'emerald' },
                            { user: 'N_Gates', action: 'System Entry', time: '2h ago', color: 'purple' },
                            { user: 'L_Wong', action: 'Data Export', time: '5h ago', color: 'brand' },
                        ].map((item, idx) => (
                            <motion.div 
                                key={idx} 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.7 + (idx * 0.1) }}
                                className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all cursor-pointer group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-9 h-9 rounded-xl bg-${item.color}-500/10 border border-${item.color}-400/20 flex items-center justify-center text-${item.color}-400 group-hover:bg-${item.color}-500 group-hover:text-white transition-all`}>
                                        <span className="text-xs font-black">{item.user[0]}</span>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xs font-black text-slate-200 tracking-tight truncate">{item.user}</div>
                                        <div className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-1">{item.action}</div>
                                    </div>
                                </div>
                                <span className="text-[9px] text-slate-700 font-black font-mono uppercase pl-2">{item.time}</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
