import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Server, Database, Activity, ShieldAlert, Cpu } from 'lucide-react';

export default function Settings() {
    const [loading, setLoading] = useState(true);
    const [health, setHealth] = useState<any>(null);
    const [maintenanceMode, setMaintenanceMode] = useState(false);

    useEffect(() => {
        fetchHealth();
    }, []);

    const fetchHealth = async () => {
        try {
            // Note: Our admin server index.ts doesn't have a /api/health route explicitly defined for Admin System metrics yet.
            // But we can hit the default GET /api/health on the main remote API as a placeholder, or simulate it.
            // For now, we simulate pulling system configs from the Admin Server's perspective.
            setTimeout(() => {
                setHealth({
                    status: 'operational',
                    uptime: '14d 6h 32m',
                    apiLatency: '45ms',
                    dbConnection: 'connected',
                    lastBackup: new Date().toLocaleString()
                });
                setLoading(false);
            }, 800);
        } catch (err) {
            console.error(err);
        }
    };

    const toggleMaintenance = () => {
        if (confirm(`Are you sure you want to ${maintenanceMode ? 'disable' : 'enable'} Maintenance Mode? Users will ${maintenanceMode ? 'regain' : 'lose'} access.`)) {
            setMaintenanceMode(!maintenanceMode);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-200 to-slate-400 inline-block drop-shadow-sm mb-1">
                        System Settings
                    </h1>
                    <p className="text-slate-400 text-sm">Global configurations and backend health overview.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* System Health Card */}
                <div className="glass-card p-6 shadow-xl shadow-black/20 flex flex-col md:col-span-2">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800/50">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
                            <Activity size={20} />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-200">System Health Overview</h2>
                    </div>

                    {loading ? (
                        <div className="h-48 flex items-center justify-center text-slate-500 animate-pulse">
                            Pinging database...
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800/50">
                                <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                                    <Server size={14} /> API Server Status
                                </div>
                                <div className="text-xl font-bold text-emerald-400 capitalize">
                                    {health?.status}
                                </div>
                            </div>
                            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800/50">
                                <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                                    <Database size={14} /> Database Connectivity
                                </div>
                                <div className="text-xl font-bold text-emerald-400 capitalize">
                                    {health?.dbConnection}
                                </div>
                            </div>
                            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800/50">
                                <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                                    <Activity size={14} /> Average Latency
                                </div>
                                <div className="text-xl font-bold text-slate-200">
                                    {health?.apiLatency}
                                </div>
                            </div>
                            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800/50">
                                <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                                    <Cpu size={14} /> Total Uptime
                                </div>
                                <div className="text-xl font-bold text-slate-200">
                                    {health?.uptime}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Operations & Maintenance */}
                <div className="glass-card p-6 shadow-xl shadow-black/20 flex flex-col">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800/50">
                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
                            <SettingsIcon size={20} />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-200">Global Operations</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-slate-200 font-medium text-sm">Maintenance Mode</h3>
                                <p className="text-slate-500 text-xs mt-1 max-w-[180px]">Disables public app access and displays downtime message.</p>
                            </div>
                            <button
                                onClick={toggleMaintenance}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${maintenanceMode ? 'bg-amber-500' : 'bg-slate-700'}`}
                            >
                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${maintenanceMode ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <div className="pt-6 border-t border-slate-800/50">
                            <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors border border-red-500/20 text-sm font-medium">
                                <ShieldAlert size={16} /> Force Restart Server
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
