import React, { useEffect, useState } from 'react';
import { Users, MoonStar, Zap, Award } from 'lucide-react';

interface Stats {
    totalUsers: number;
    activeDreams: number;
    completedTasks: number;
    totalCoinsAwarded: number;
}

export default function Dashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:5001/api/stats')
            .then(res => res.json())
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch stats", err);
                setLoading(false);
            });
    }, []);

    const KpiCard = ({ title, value, icon: Icon, trend }: { title: string, value: string | number, icon: React.ElementType, trend: string }) => (
        <div className="glass-card p-6 flex items-start justify-between group hover:-translate-y-1 transition-transform duration-300">
            <div>
                <h3 className="text-slate-400 font-medium text-sm mb-2">{title}</h3>
                <p className="text-3xl font-bold text-slate-100 group-hover:bg-gradient-to-r group-hover:from-brand-300 group-hover:to-white group-hover:bg-clip-text group-hover:text-transparent transition-all">
                    {value}
                </p>
                <div className="mt-4 flex items-center text-xs space-x-2">
                    <span className="text-green-400 bg-green-400/10 px-2 py-0.5 rounded font-medium">
                        ↑ {trend}
                    </span>
                    <span className="text-slate-500">vs last month</span>
                </div>
            </div>
            <div className="p-4 bg-brand-500/10 rounded-xl shadow-[inset_0_0_0_1px_rgba(139,92,246,0.2)]">
                <Icon size={24} className="text-brand-400" />
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-300 to-indigo-100 inline-block drop-shadow-sm mb-2">
                    System Overview
                </h1>
                <p className="text-slate-400 font-medium">Welcome back, Admin. Here's what's happening on Real Dream.</p>
            </div>

            {loading ? (
                <div className="text-slate-400 animate-pulse">Loading live database metrics...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KpiCard title="Total Users" value={stats?.totalUsers?.toLocaleString() || "0"} icon={Users} trend="12%" />
                    <KpiCard title="Active Dreams" value={stats?.activeDreams?.toLocaleString() || "0"} icon={MoonStar} trend="8%" />
                    <KpiCard title="Total Tasks Finished" value={stats?.completedTasks?.toLocaleString() || "0"} icon={Zap} trend="24%" />
                    <KpiCard title="Total Coins Awarded" value={stats?.totalCoinsAwarded?.toLocaleString() || "0"} icon={Award} trend="4%" />
                </div>
            )}

            <div className="glass-card p-8 h-96 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <p className="text-slate-500 text-lg">System Health Charts Loading...</p>
                </div>
            </div>
        </div>
    );
}
