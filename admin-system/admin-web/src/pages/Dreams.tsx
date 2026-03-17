import { useEffect, useState } from 'react';
import { Search, MoonStar, CheckCircle2, Circle, X, Info, Trash2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Dream {
    id: string;
    title: string;
    type: string;
    privacy: string;
    progress: number;
    is_completed: boolean;
    created_at: string;
    username: string;
    full_name: string;
}

export default function Dreams() {
    const [dreams, setDreams] = useState<Dream[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDream, setSelectedDream] = useState<Dream | null>(null);

    useEffect(() => {
        fetchDreams();
    }, []);

    const fetchDreams = () => {
        setLoading(true);
        fetch('http://localhost:5001/api/dreams', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
            }
        })
            .then(res => res.json())
            .then(data => {
                setDreams(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch dreams", err);
                setLoading(false);
            });
    };

    const handleDeleteDream = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete the dream "${title}"?\nThis action cannot be undone.`)) return;

        try {
            const res = await fetch(`http://localhost:5001/api/admin/dreams/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
                }
            });

            if (res.ok) {
                fetchDreams();
            } else {
                const data = await res.json();
                alert(`Failed to delete dream: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting dream:', error);
            alert('An error occurred while deleting the dream.');
        }
    };

    const filteredDreams = dreams.filter(d =>
        d.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out h-full flex flex-col relative">
             {/* Ambient Glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/5 blur-[100px] -z-10" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-slate-500">Content Oversight</span>
                    </div>
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-500 tracking-tighter">
                        Dreams
                    </h1>
                </motion.div>

                <div className="relative group w-full md:w-80">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search size={16} className="text-slate-600 group-focus-within:text-brand-400 transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="w-full bg-slate-900 border border-white/5 text-slate-200 text-sm rounded-2xl focus:ring-1 focus:ring-brand-500/40 block pl-11 p-3.5 placeholder-slate-700 outline-none transition-all font-medium"
                        placeholder="Filter Dream IDs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card flex-1 overflow-hidden flex flex-col relative shadow-2xl border border-white/5"
            >
                <div className="overflow-x-auto flex-1 custom-scrollbar">
                    <table className="w-full text-sm text-left text-slate-300">
                        <thead className="text-[10px] text-slate-500 uppercase font-black bg-slate-900/50 sticky top-0 z-10 border-b border-white/5 backdrop-blur-xl">
                            <tr>
                                <th scope="col" className="px-8 py-5 tracking-[0.2em]">Dream</th>
                                <th scope="col" className="px-6 py-5 tracking-[0.2em]">User</th>
                                <th scope="col" className="px-6 py-5 tracking-[0.2em]">Type / Privacy</th>
                                <th scope="col" className="px-6 py-5 tracking-[0.2em]">Progress</th>
                                <th scope="col" className="px-6 py-5 tracking-[0.2em]">Status</th>
                                <th scope="col" className="px-8 py-5 tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse bg-white/[0.01]">
                                        <td colSpan={6} className="px-8 py-8" />
                                    </tr>
                                ))
                            ) : filteredDreams.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center text-slate-600 font-bold uppercase tracking-widest text-xs">
                                        No constructs detected in current buffer.
                                    </td>
                                </tr>
                            ) : (
                                filteredDreams.map((dream, idx) => (
                                    <motion.tr 
                                        key={dream.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.03 }}
                                        className="group hover:bg-white/[0.03] transition-all duration-300"
                                    >
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20 group-hover:shadow-[0_0_15px_-5px_rgba(99,102,241,0.5)] transition-all">
                                                    <MoonStar size={18} />
                                                </div>
                                                <div className="font-bold text-slate-100 group-hover:text-white transition-colors tracking-tight">{dream.title}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-400 font-black text-[11px] uppercase tracking-tighter group-hover:text-brand-400 transition-colors">
                                                 @{dream.username}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-black uppercase text-slate-200 tracking-wider">{dream.type}</span>
                                                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">{dream.privacy} access</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-24 bg-slate-800 rounded-full h-1 relative overflow-hidden shadow-inner">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min(dream.progress, 100)}%` }}
                                                        className="bg-brand-500 h-full rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)]" 
                                                    />
                                                </div>
                                                <span className="text-[10px] font-black font-mono text-brand-400">{dream.progress}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {dream.is_completed ? (
                                                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-400 tracking-widest bg-emerald-500/5 px-2 py-1 rounded-md border border-emerald-500/20">
                                                    <CheckCircle2 size={12} /> Completed
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-500 tracking-widest bg-slate-800/50 px-2 py-1 rounded-md border border-white/5">
                                                    <Circle size={10} className="animate-pulse" /> Processing
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button
                                                    onClick={() => setSelectedDream(dream)}
                                                    className="p-2 bg-brand-500/10 hover:bg-brand-500 text-brand-500 hover:text-white rounded-xl transition-all border border-brand-500/20"
                                                >
                                                    <Info size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteDream(dream.id, dream.title)}
                                                    className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/20"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Modal - Dream Matrix Details */}
            <AnimatePresence>
                {selectedDream && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-xl" 
                            onClick={() => setSelectedDream(null)}
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#0a0f1e] border border-white/10 shadow-3xl rounded-3xl w-full max-w-md overflow-hidden relative z-10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center p-6 border-b border-white/5 bg-slate-900/50">
                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Dream Details</h3>
                                <button onClick={() => setSelectedDream(null)} className="text-slate-500 hover:text-white p-2 rounded-xl transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-8 space-y-8">
                                <div className="flex items-center gap-6 pb-6 border-b border-white/5">
                                    <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20 shadow-xl shadow-indigo-500/10">
                                        <MoonStar size={40} />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-2xl font-black text-slate-100 tracking-tighter truncate">{selectedDream.title}</h4>
                                        <div className="text-brand-400 font-black uppercase text-[10px] tracking-widest mt-1">Uplink: @{selectedDream.username}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { label: 'Layer Protocol', value: selectedDream.type },
                                        { label: 'Access Code', value: selectedDream.privacy },
                                        { label: 'Neural Status', value: selectedDream.is_completed ? 'SYNCHRONIZED' : 'IN-PROGRESS' },
                                        { label: 'Uptime', value: new Date(selectedDream.created_at).toLocaleDateString() }
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-slate-900/80 p-4 rounded-2xl border border-white/5 space-y-1">
                                            <div className="text-slate-600 text-[9px] font-black uppercase tracking-widest">{stat.label}</div>
                                            <div className={`text-xs font-black uppercase truncate ${i === 2 && selectedDream.is_completed ? 'text-emerald-400' : 'text-slate-100'}`}>{stat.value}</div>
                                        </div>
                                    ))}
                                    
                                    <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/5 col-span-2 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <div className="text-slate-600 text-[9px] font-black uppercase tracking-widest">Global Synaptic Progress</div>
                                            <div className="text-brand-400 font-mono text-xs font-black">{selectedDream.progress}%</div>
                                        </div>
                                        <div className="relative w-full h-2 bg-slate-950 rounded-full overflow-hidden shadow-inner border border-white/[0.02]">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${selectedDream.progress}%` }}
                                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-brand-600 to-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 col-span-2 space-y-1">
                                        <div className="text-slate-700 text-[8px] font-black uppercase tracking-widest">Raw System UID</div>
                                        <div className="text-[10px] text-slate-500 font-mono break-all font-medium">{selectedDream.id}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-white/5 bg-slate-900/50 flex justify-end gap-3">
                                <button 
                                    onClick={() => {
                                        window.open(`https://nexus-core.io/dreams/${selectedDream.id}`, '_blank');
                                    }}
                                    className="p-3 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl transition-all border border-white/5"
                                >
                                    <ExternalLink size={16} />
                                </button>
                                <button onClick={() => setSelectedDream(null)} className="px-8 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-600/20 active:scale-95">
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
