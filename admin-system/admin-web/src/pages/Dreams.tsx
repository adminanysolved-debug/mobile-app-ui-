import { useEffect, useState } from 'react';
import { Search, MoonStar, CheckCircle2, Circle } from 'lucide-react';

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

    useEffect(() => {
        fetch('http://localhost:5001/api/dreams')
            .then(res => res.json())
            .then(data => {
                setDreams(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch dreams", err);
                setLoading(false);
            });
    }, []);

    const filteredDreams = dreams.filter(d =>
        d.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-300 to-indigo-100 inline-block drop-shadow-sm mb-1">
                        Dreams Registry
                    </h1>
                    <p className="text-slate-400 text-sm">Monitor all user goals and challenges.</p>
                </div>

                <div className="relative group w-full sm:w-72">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={16} className="text-slate-500 group-focus-within:text-brand-400 transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="w-full bg-slate-900/50 border border-slate-700/50 text-slate-200 text-sm rounded-lg focus:ring-brand-500/50 focus:border-brand-500 block pl-9 p-2.5 placeholder-slate-500 transition-all outline-none"
                        placeholder="Search dreams or users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="glass-card flex-1 overflow-hidden flex flex-col relative shadow-xl shadow-black/20">
                <div className="overflow-x-auto flex-1 custom-scrollbar">
                    <table className="w-full text-sm text-left text-slate-300">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-900/80 sticky top-0 z-10 border-b border-slate-700/50 backdrop-blur-md">
                            <tr>
                                <th scope="col" className="px-6 py-4 font-medium tracking-wider">Dream Title</th>
                                <th scope="col" className="px-6 py-4 font-medium tracking-wider">Owner</th>
                                <th scope="col" className="px-6 py-4 font-medium tracking-wider">Type / Privacy</th>
                                <th scope="col" className="px-6 py-4 font-medium tracking-wider">Progress</th>
                                <th scope="col" className="px-6 py-4 font-medium tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-4 font-medium tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500 animate-pulse">
                                        Loading dreams...
                                    </td>
                                </tr>
                            ) : filteredDreams.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        No dreams found matching "{searchTerm}"
                                    </td>
                                </tr>
                            ) : (
                                filteredDreams.map((dream) => (
                                    <tr key={dream.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
                                                    <MoonStar size={18} />
                                                </div>
                                                <div className="font-medium text-slate-200">{dream.title}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400">
                                            @{dream.username}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="capitalize text-xs text-slate-300">{dream.type}</span>
                                                <span className="capitalize text-[10px] text-slate-500">{dream.privacy}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-full bg-slate-800 rounded-full h-1.5 max-w-[80px]">
                                                    <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${Math.min(dream.progress, 100)}%` }}></div>
                                                </div>
                                                <span className="text-xs text-slate-400">{dream.progress}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {dream.is_completed ? (
                                                <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                                                    <CheckCircle2 size={14} /> Completed
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                                                    <Circle size={14} className="text-slate-600" /> Active
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-brand-400 hover:text-brand-300 hover:bg-brand-400/10 px-3 py-1.5 rounded transition-colors text-xs font-medium border border-transparent hover:border-brand-500/30">
                                                Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
