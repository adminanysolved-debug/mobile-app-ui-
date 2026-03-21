import { useEffect, useState } from 'react';
import { Mail, Search, Shield, ShieldCheck, X, Coins, Trash2, Settings2, ExternalLink, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../lib/config';

interface User {
    id: string;
    email: string;
    username: string;
    full_name: string;
    auth_provider: string;
    is_vendor: boolean;
    vendor_tier: string;
    vendor_business_name: string | null;
    subscription_tier: string;
    profile_photo?: string;
    profile_image?: string;
    coins: number;
    age?: number;
    gender?: string;
    created_at: string;
}

export default function Users() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [editRole, setEditRole] = useState(false);
    const [newIsVendor, setNewIsVendor] = useState(false);
    const [newVendorTier, setNewVendorTier] = useState('basic');
    const [newSubscriptionTier, setNewSubscriptionTier] = useState('free');
    const [editSubscription, setEditSubscription] = useState(false);
    
    const [adjustingCoins, setAdjustingCoins] = useState(false);
    const [coinAmount, setCoinAmount] = useState('50');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = () => {
        setLoading(true);
        fetch(`${API_BASE_URL}/api/users`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
            }
        })
            .then(res => {
                if (res.status === 401) {
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminUser');
                    window.location.href = '/login';
                    return;
                }
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setUsers(data);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch users", err);
                setLoading(false);
            });
    };

    const handleDeleteUser = async (id: string, username: string) => {
        if (!confirm(`Are you sure you want to delete the user "${username}"?\nThis action cannot be undone.`)) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
                }
            });

            if (res.ok) {
                fetchUsers();
            } else {
                const data = await res.json();
                alert(`Failed to delete user: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('An error occurred while deleting the user.');
        }
    };

    const handleUpdateVendor = async () => {
        if (!selectedUser) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/users/${selectedUser.id}/vendor`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ is_vendor: newIsVendor, vendor_tier: newVendorTier })
            });

            if (res.ok) {
                const data = await res.json();
                alert(data.message);
                fetchUsers();
                setSelectedUser({ ...selectedUser, is_vendor: newIsVendor, vendor_tier: newVendorTier });
                setEditRole(false);
            } else {
                const data = await res.json();
                alert(`Failed to update vendor: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error updating vendor:', error);
            alert('An error occurred while updating the vendor.');
        }
    };

    const handleUpdateSubscription = async () => {
        if (!selectedUser) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/users/${selectedUser.id}/subscription`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ subscription_tier: newSubscriptionTier })
            });

            if (res.ok) {
                const data = await res.json();
                alert(data.message);
                fetchUsers();
                setSelectedUser({ ...selectedUser, subscription_tier: newSubscriptionTier });
                setEditSubscription(false);
            } else {
                const data = await res.json();
                alert(`Failed to update subscription: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error updating subscription:', error);
            alert('An error occurred while updating the subscription.');
        }
    };

    const handleAdjustCoins = async () => {
        if (!selectedUser) return;
        const amount = parseInt(coinAmount);
        if (isNaN(amount)) return alert('Please enter a valid number');

        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/users/${selectedUser.id}/coins`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ amount, description: 'Admin adjustment from dashboard' })
            });

            if (res.ok) {
                alert(`Successfully adjusted coins by ${amount}`);
                fetchUsers();
                setSelectedUser({ ...selectedUser, coins: selectedUser.coins + amount });
                setAdjustingCoins(false);
            } else {
                const data = await res.json();
                alert(`Failed to adjust coins: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error adjusting coins:', error);
            alert('An error occurred while adjusting coins.');
        }
    };

    const openUserModal = (user: User) => {
        setSelectedUser(user);
        setNewIsVendor(user.is_vendor);
        setNewVendorTier(user.vendor_tier || 'basic');
        setNewSubscriptionTier(user.subscription_tier || 'free');
        setEditRole(false);
        setEditSubscription(false);
        setAdjustingCoins(false);
    };

    const filteredUsers = Array.isArray(users) ? users.filter(u =>
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    const getPhotoUrl = (user: User) => {
        return user.profile_photo || user.profile_image;
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out h-full flex flex-col relative">
            {/* Ambient Background Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/5 blur-[120px] -z-10" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-3 bg-brand-500 rounded-full" />
                        <span className="text-[10px] uppercase font-bold tracking-widest text-brand-500">Security Management</span>
                    </div>
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-500 drop-shadow-sm tracking-tighter">
                        User Control
                    </h1>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative group w-full md:w-80"
                >
                    <div className="absolute -inset-1 bg-gradient-to-r from-brand-600/20 to-indigo-600/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search size={16} className="text-slate-500 group-focus-within:text-brand-400 transition-colors" />
                        </div>
                        <input
                            type="text"
                            className="w-full bg-slate-900 shadow-2xl border border-white/5 text-slate-200 text-sm rounded-2xl focus:ring-1 focus:ring-brand-500/50 focus:border-brand-500/50 block pl-11 p-3.5 placeholder-slate-600 transition-all outline-none font-medium"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </motion.div>
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card flex-1 overflow-hidden flex flex-col relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5"
            >
                <div className="overflow-x-auto flex-1 custom-scrollbar">
                    <table className="w-full text-sm text-left text-slate-300">
                        <thead className="text-[10px] text-slate-500 uppercase font-black bg-slate-900/50 sticky top-0 z-10 border-b border-white/5 backdrop-blur-xl">
                            <tr>
                                <th scope="col" className="px-8 py-5 tracking-[0.2em]">User</th>
                                <th scope="col" className="px-6 py-5 tracking-[0.2em]">Status</th>
                                <th scope="col" className="px-6 py-5 tracking-[0.2em] text-brand-400">Coins</th>
                                <th scope="col" className="px-6 py-5 tracking-[0.2em]">Plan</th>
                                <th scope="col" className="px-6 py-5 tracking-[0.2em]">Joined</th>
                                <th scope="col" className="px-8 py-5 tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse bg-white/[0.01]">
                                        <td colSpan={6} className="px-8 py-10" />
                                    </tr>
                                ))
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center text-slate-600 italic font-medium">
                                        No neural signatures found matching your query.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user, idx) => (
                                    <motion.tr 
                                        key={user.id} 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="group hover:bg-white/[0.03] transition-all duration-300 border-transparent hover:border-brand-500/10 cursor-default"
                                    >
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                     <div className="absolute -inset-1 bg-gradient-to-tr from-brand-600/50 to-indigo-600/50 rounded-full blur opacity-0 group-hover:opacity-40 transition duration-500" />
                                                    {getPhotoUrl(user) ? (
                                                        <img 
                                                            src={getPhotoUrl(user)} 
                                                            alt={user.username}
                                                            className="relative w-11 h-11 rounded-full object-cover border-2 border-white/5 shadow-2xl"
                                                        />
                                                    ) : (
                                                        <div className="relative w-11 h-11 rounded-full bg-slate-800 flex items-center justify-center font-black text-slate-400 border border-white/5 text-sm">
                                                            {user.username?.charAt(0).toUpperCase() || '?'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-100 group-hover:text-white transition-colors tracking-tight">{user.full_name || user.username}</div>
                                                    <div className="text-slate-500 text-[10px] font-bold flex items-center gap-1.5 uppercase tracking-tighter mt-1 group-hover:text-slate-400">
                                                        <Mail size={10} />
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            {user.is_vendor ? (
                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-amber-500 bg-amber-500/5 px-2.5 py-1.5 rounded-lg w-fit border border-amber-500/10 shadow-[0_0_15px_-5px_rgba(245,158,11,0.3)]">
                                                    <ShieldCheck size={12} />
                                                    Vendor Node
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 bg-slate-800/50 px-2.5 py-1.5 rounded-lg w-fit border border-white/5">
                                                    <Shield size={12} />
                                                    Civic Core
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-brand-400 font-black font-mono text-base">
                                                <Coins size={16} className="text-brand-500" />
                                                {user.coins?.toLocaleString() || 0}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-800 px-2 py-1 rounded-md border border-white/5">
                                                {user.subscription_tier || 'MEMBER'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-slate-500 font-mono text-[10px] font-medium">
                                            {new Date(user.created_at).toISOString().split('T')[0]}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                <button
                                                    onClick={() => openUserModal(user)}
                                                    className="p-2 bg-brand-500/10 hover:bg-brand-500 text-brand-500 hover:text-white rounded-xl transition-all border border-brand-500/20 shadow-lg shadow-brand-500/10"
                                                    title="Manage User"
                                                >
                                                    <Settings2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id, user.username)}
                                                    className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/20 shadow-lg shadow-red-500/10"
                                                    title="Delete User"
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
                <div className="bg-slate-900/80 backdrop-blur-md border-t border-white/5 p-5 text-[10px] text-slate-600 font-black uppercase tracking-[0.3em] flex justify-between items-center">
                    <span>Repository Nodes Active: {filteredUsers.length}</span>
                    <Activity size={14} className="animate-pulse text-emerald-500" />
                </div>
            </motion.div>

            {/* Modal - User Control Center */}
            <AnimatePresence>
                {selectedUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-xl" 
                            onClick={() => setSelectedUser(null)}
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="bg-[#0a0f1e] border border-white/10 shadow-[0_0_100px_rgba(139,92,246,0.15)] rounded-3xl w-full max-w-2xl overflow-hidden relative z-10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                                <Activity size={120} className="text-brand-500" />
                            </div>

                            <div className="flex justify-between items-center p-6 border-b border-white/5">
                                <div className="flex items-center gap-2">
                                     <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                                     <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">User Management</h3>
                                </div>
                                <button onClick={() => setSelectedUser(null)} className="text-slate-500 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-8 space-y-8 overflow-y-auto max-h-[75vh] custom-scrollbar">
                                <div className="flex items-center gap-8 pb-8 border-b border-white/5">
                                    <div className="relative group/photo">
                                        <div className="absolute -inset-2 bg-gradient-to-tr from-brand-600 to-indigo-600 rounded-2xl blur-md opacity-20 group-hover/photo:opacity-40 transition duration-500" />
                                        {getPhotoUrl(selectedUser) ? (
                                            <img 
                                                src={getPhotoUrl(selectedUser)} 
                                                alt={selectedUser.username}
                                                className="relative w-28 h-28 rounded-2xl object-cover border border-white/10 shadow-3xl"
                                            />
                                        ) : (
                                            <div className="relative w-28 h-28 rounded-2xl bg-slate-900 flex items-center justify-center font-black text-4xl text-brand-500 border border-white/10 shadow-3xl">
                                                {selectedUser.username?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                        )}
                                        <div className="absolute -bottom-2 -right-2 p-1.5 bg-brand-600 rounded-lg text-white shadow-xl shadow-brand-600/30">
                                            <Shield size={14} />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-3xl font-black text-slate-100 tracking-tighter">{selectedUser.full_name || 'Anonymous Subject'}</h4>
                                        <p className="text-brand-400 font-black uppercase text-xs tracking-widest flex items-center gap-2">
                                            <span>@nexus_{selectedUser.username}</span>
                                            <ExternalLink size={12} className="opacity-40" />
                                        </p>
                                        <div className="flex gap-2.5 pt-3">
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${selectedUser.is_vendor ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'bg-brand-500/10 text-brand-400 border border-brand-500/20'}`}>
                                                {selectedUser.is_vendor ? 'Class-V Vendor' : 'Level-1 Member'}
                                            </span>
                                            <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                {selectedUser.subscription_tier || 'FREE'} Protocol
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Data Stream */}
                                    <div className="space-y-4">
                                         <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                            <Activity size={12} />
                                            Data Stream
                                         </h5>
                                         <div className="space-y-2">
                                            {[
                                                { label: 'Uplink ID', value: selectedUser.email },
                                                { label: 'Neural Age', value: selectedUser.age || 'Unknown' },
                                                { label: 'Signature', value: selectedUser.gender || 'Undefined' },
                                                { label: 'Init Date', value: new Date(selectedUser.created_at).toLocaleDateString() }
                                            ].map((row, i) => (
                                                <div key={i} className="bg-slate-900/50 p-3.5 rounded-2xl border border-white/5 flex justify-between items-center group/row hover:bg-slate-800/50 transition-colors">
                                                    <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest group-hover/row:text-slate-500">{row.label}</span>
                                                    <span className="text-slate-300 text-xs font-black font-mono tracking-tight group-hover/row:text-white">{row.value}</span>
                                                </div>
                                            ))}
                                         </div>
                                    </div>

                                    {/* Resource & Access */}
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <h5 className="text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-2">
                                                <Coins size={12} />
                                                Coin Management
                                            </h5>
                                            <div className="bg-gradient-to-br from-brand-600/10 to-indigo-600/5 p-5 rounded-3xl border border-white/5 relative overflow-hidden group/coins">
                                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/coins:opacity-10 transition-opacity">
                                                    <Coins size={40} className="text-amber-500" />
                                                </div>

                                                <div className="flex justify-between items-end relative z-10">
                                                    <div>
                                                        <div className="text-slate-500 text-[9px] uppercase font-black tracking-[0.2em] mb-2">Available Credits</div>
                                                        <div className="text-4xl font-black text-brand-400 flex items-center gap-2.5 drop-shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                                                            <Coins size={28} className="text-brand-500" />
                                                            {selectedUser.coins?.toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => setAdjustingCoins(!adjustingCoins)}
                                                        className="bg-white/10 hover:bg-white text-white hover:text-black font-black text-[10px] uppercase px-4 py-2 rounded-xl transition-all active:scale-95 shadow-lg border border-white/10"
                                                    >
                                                        {adjustingCoins ? 'Abort' : 'Adjust'}
                                                    </button>
                                                </div>

                                                <AnimatePresence>
                                                    {adjustingCoins && (
                                                        <motion.div 
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="space-y-3 pt-6 relative z-10 overflow-hidden"
                                                        >
                                                            <div className="flex gap-2">
                                                                <input 
                                                                    type="number" 
                                                                    value={coinAmount}
                                                                    onChange={(e) => setCoinAmount(e.target.value)}
                                                                    className="flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white font-black text-sm outline-none focus:border-brand-500 transition-all font-mono"
                                                                    placeholder="+/- Amount"
                                                                />
                                                                <button 
                                                                    onClick={handleAdjustCoins}
                                                                    className="bg-brand-600 text-white font-black px-6 py-2 rounded-xl hover:bg-brand-500 transition-all shadow-lg shadow-brand-600/20 active:scale-95 text-xs uppercase"
                                                                >
                                                                    Sync
                                                                </button>
                                                            </div>
                                                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest italic leading-relaxed text-center">Neural update will propagate globally.</p>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                                                <ShieldCheck size={12} />
                                                Permissions
                                            </h5>
                                            <div className="bg-slate-900/50 p-5 rounded-3xl border border-white/5 space-y-5">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <span className="text-slate-100 text-xs font-black uppercase tracking-wider">Vendor Protocol</span>
                                                        <p className="text-[9px] text-slate-600 mt-1 font-bold uppercase">Grant subject marketplace access.</p>
                                                    </div>
                                                    <button onClick={() => setEditRole(!editRole)} className="bg-white/5 hover:bg-brand-500/20 hover:text-brand-400 p-2 rounded-xl border border-white/5 transition-all">
                                                        <Settings2 size={16} className="text-slate-500" />
                                                    </button>
                                                </div>

                                                <AnimatePresence>
                                                    {editRole && (
                                                        <motion.div 
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="space-y-4 pt-2 overflow-hidden"
                                                        >
                                                            <label className="flex items-center gap-3 cursor-pointer group p-3 bg-white/[0.02] border border-white/5 rounded-2xl">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={newIsVendor}
                                                                    onChange={(e) => setNewIsVendor(e.target.checked)}
                                                                    className="w-5 h-5 rounded-lg bg-slate-800 border-white/5 text-brand-600 focus:ring-brand-500/50 transition-all"
                                                                />
                                                                <span className="text-slate-300 text-[11px] font-black uppercase group-hover:text-white transition-colors">Authorize Access</span>
                                                            </label>

                                                            {newIsVendor && (
                                                                <motion.div 
                                                                    initial={{ opacity: 0, y: -10 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    className="space-y-2.5"
                                                                >
                                                                    <span className="text-slate-600 text-[9px] font-black uppercase ml-1">Assigned Protocol Level</span>
                                                                    <select
                                                                        value={newVendorTier}
                                                                        onChange={(e) => setNewVendorTier(e.target.value)}
                                                                        className="bg-slate-900 border border-white/10 rounded-2xl p-3.5 text-slate-200 text-xs font-bold outline-none w-full appearance-none hover:border-brand-500 transition-colors cursor-pointer shadow-inner"
                                                                    >
                                                                        <option value="basic">Standard Protocol (Limited)</option>
                                                                        <option value="pro">Advanced Protocol (Pro)</option>
                                                                        <option value="enterprise">Full Synergy (Enterprise)</option>
                                                                    </select>
                                                                </motion.div>
                                                            )}
                                                            
                                                            <button 
                                                                onClick={handleUpdateVendor}
                                                                className="w-full bg-slate-100 hover:bg-white text-black font-black text-[10px] py-3 rounded-2xl transition-all shadow-xl active:scale-95 uppercase tracking-widest"
                                                            >
                                                                Update Permissions
                                                            </button>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                <div className="pt-4 border-t border-white/5">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <span className="text-slate-100 text-xs font-black uppercase tracking-wider">Subscription Tier</span>
                                                            <p className="text-[9px] text-slate-600 mt-1 font-bold uppercase">Modify subject service level.</p>
                                                        </div>
                                                        <button onClick={() => setEditSubscription(!editSubscription)} className="bg-white/5 hover:bg-indigo-500/20 hover:text-indigo-400 p-2 rounded-xl border border-white/5 transition-all">
                                                            <Settings2 size={16} className="text-slate-500" />
                                                        </button>
                                                    </div>

                                                    <AnimatePresence>
                                                        {editSubscription && (
                                                            <motion.div 
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="space-y-4 pt-4 overflow-hidden"
                                                            >
                                                                <div className="space-y-2.5">
                                                                    <span className="text-slate-600 text-[9px] font-black uppercase ml-1">Subscription Level</span>
                                                                    <select
                                                                        value={newSubscriptionTier}
                                                                        onChange={(e) => setNewSubscriptionTier(e.target.value)}
                                                                        className="bg-slate-900 border border-white/10 rounded-2xl p-3.5 text-slate-200 text-xs font-bold outline-none w-full appearance-none hover:border-indigo-500 transition-colors cursor-pointer shadow-inner"
                                                                    >
                                                                        <option value="free">FREE (Standard)</option>
                                                                        <option value="bronze">BRONZE (Basic+)</option>
                                                                        <option value="silver">SILVER (Advantage)</option>
                                                                        <option value="gold">GOLD (Elite)</option>
                                                                        <option value="platinum">PLATINUM (Infinite)</option>
                                                                    </select>
                                                                </div>
                                                                
                                                                <button 
                                                                    onClick={handleUpdateSubscription}
                                                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] py-3 rounded-2xl transition-all shadow-xl active:scale-95 uppercase tracking-widest"
                                                                >
                                                                    Re-Synchronize Tier
                                                                </button>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-white/5 bg-slate-900/50 flex justify-between items-center px-10">
                                 <div className="text-[9px] text-slate-700 font-mono font-black uppercase">Core Subject: {selectedUser.id}</div>
                                     <button onClick={() => setSelectedUser(null)} className="px-8 py-3 bg-white/5 hover:bg-brand-500 hover:text-white text-slate-300 rounded-2xl transition-all text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 border border-white/5">
                                    Close Editor
                                 </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
