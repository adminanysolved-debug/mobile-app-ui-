import { useEffect, useState } from 'react';
import { Search, Briefcase, CheckCircle2, Circle, ShieldBan, MoreVertical, Building2, User as UserIcon, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
    id: string;
    username: string;
    email: string;
    full_name: string;
    is_vendor: boolean;
    vendor_business_name: string | null;
    vendor_tier: string | null;
    created_at: string;
}

export default function Vendors() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = () => {
        setLoading(true);
        fetch('http://localhost:5001/api/users', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
            }
        })
            .then(res => res.json())
            .then(data => {
                const vendorsOrApplied = data.filter((u: User) => u.is_vendor === true || Boolean(u.vendor_business_name));
                setUsers(vendorsOrApplied);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch users", err);
                setLoading(false);
            });
    };

    const handleUpdateVendorStatus = async (userId: string, isVendor: boolean, tier: string | null) => {
        if (!confirm(`Are you sure you want to ${isVendor ? 'approve' : 'revoke'} vendor status for this user?`)) return;

        try {
            const res = await fetch(`http://localhost:5001/api/admin/users/${userId}/vendor`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
                },
                body: JSON.stringify({ is_vendor: isVendor, vendor_tier: tier })
            });

            if (res.ok) {
                fetchUsers();
                setOpenMenuId(null);
            } else {
                const data = await res.json();
                alert(`Failed to update vendor: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error updating vendor:', error);
            alert('An error occurred.');
        }
    };

    const filteredUsers = users.filter(u =>
        u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.vendor_business_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out h-full flex flex-col relative" onClick={() => setOpenMenuId(null)}>
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 blur-[100px] -z-10" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                        <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-emerald-500">Business Control</span>
                    </div>
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-emerald-100 to-emerald-500 tracking-tighter">
                        Vendors
                    </h1>
                </motion.div>

                <div className="relative group w-full md:w-80">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search size={16} className="text-slate-600 group-focus-within:text-emerald-400 transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="w-full bg-slate-900 border border-white/5 text-slate-200 text-sm rounded-2xl focus:ring-1 focus:ring-emerald-500/40 block pl-11 p-3.5 placeholder-slate-700 outline-none transition-all font-medium"
                        placeholder="Search Business Hubs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card flex-1 overflow-hidden flex flex-col relative shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-white/5"
            >
                <div className="overflow-x-auto flex-1 custom-scrollbar">
                    <table className="w-full text-sm text-left text-slate-300">
                        <thead className="text-[10px] text-slate-500 uppercase font-black bg-slate-900/50 sticky top-0 z-10 border-b border-white/5 backdrop-blur-xl">
                            <tr>
                                <th scope="col" className="px-8 py-5 tracking-[0.2em]">Business Name</th>
                                <th scope="col" className="px-6 py-5 tracking-[0.2em]">Owner</th>
                                <th scope="col" className="px-6 py-5 tracking-[0.2em]">Tier</th>
                                <th scope="col" className="px-6 py-5 tracking-[0.2em]">Status</th>
                                <th scope="col" className="px-8 py-5 tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse bg-white/[0.01]">
                                        <td colSpan={5} className="px-8 py-10" />
                                    </tr>
                                ))
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-slate-600 uppercase font-black text-xs tracking-widest">
                                        No vendor signatures detected.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user, idx) => (
                                    <motion.tr 
                                        key={user.id} 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="group hover:bg-emerald-500/[0.02] transition-all duration-300 border-transparent hover:border-emerald-500/10"
                                    >
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="h-11 w-11 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-emerald-500 shadow-2xl transition-transform group-hover:scale-105 group-hover:rotate-3">
                                                    <Building2 size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-100 group-hover:text-white transition-colors tracking-tight text-base uppercase">{user.vendor_business_name || 'Generic Utility'}</div>
                                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-1 group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                                                        <UserIcon size={10} /> @{user.username}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="text-slate-300 font-bold text-xs">{user.email}</div>
                                            <div className="text-[10px] text-slate-600 font-bold uppercase mt-1">{user.full_name || 'Anonymous Principal'}</div>
                                        </td>
                                        <td className="px-6 py-5">
                                            {user.vendor_tier ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-brand-500 shadow-[0_0_5px_rgba(99,102,241,0.5)]" />
                                                    <span className="capitalize text-[10px] font-black tracking-widest text-slate-400 uppercase bg-white/5 border border-white/5 pl-2 pr-3 py-1 rounded-lg">
                                                        {user.vendor_tier}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-black text-slate-700 uppercase italic tracking-widest">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            {user.is_vendor ? (
                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/5 px-2.5 py-1.5 rounded-xl w-fit border border-emerald-500/10 shadow-[0_0_15px_-5px_rgba(16,185,129,0.3)]">
                                                    <ShieldCheck size={12} /> Approved
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-amber-500 bg-amber-500/5 px-2.5 py-1.5 rounded-xl w-fit border border-amber-500/10">
                                                    <Circle size={10} className="animate-pulse" /> Evaluating
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-8 py-5 text-right relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenMenuId(openMenuId === user.id ? null : user.id);
                                                }}
                                                className="p-2.5 text-slate-500 hover:text-white rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5 active:scale-90"
                                            >
                                                <MoreVertical size={20} />
                                            </button>

                                            <AnimatePresence>
                                                {openMenuId === user.id && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, scale: 0.9, x: 20, y: -10 }}
                                                        animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.9, x: 20, y: -10 }}
                                                        className="absolute right-12 top-10 w-56 bg-[#0a0f1e] border border-white/10 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.6)] py-2 z-50 overflow-hidden"
                                                    >
                                                        {!user.is_vendor ? (
                                                            <button
                                                                onClick={() => handleUpdateVendorStatus(user.id, true, "basic")}
                                                                className="w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-3 transition-all"
                                                            >
                                                                <CheckCircle2 size={16} /> Init Level: Basic
                                                            </button>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => handleUpdateVendorStatus(user.id, true, "premium")}
                                                                    className="w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-brand-400 hover:bg-brand-500/10 flex items-center gap-3 transition-all border-b border-white/5"
                                                                >
                                                                    <Briefcase size={16} /> Upgrade: High-Tier
                                                                </button>
                                                                <button
                                                                    onClick={() => handleUpdateVendorStatus(user.id, false, null)}
                                                                    className="w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 flex items-center gap-3 transition-all mt-1"
                                                                >
                                                                    <ShieldBan size={16} /> Revoke Status
                                                                </button>
                                                            </>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            <div className="flex justify-between items-center px-4">
                 <div className="text-[10px] text-slate-700 font-black uppercase tracking-[0.4em]">Integrated Business Layer Ops</div>
                 <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Marketplace Uplink Active
                 </div>
            </div>
        </div>
    );
}
