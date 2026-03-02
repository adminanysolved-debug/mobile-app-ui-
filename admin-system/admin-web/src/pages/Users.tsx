import React, { useEffect, useState } from 'react';
import { Mail, Search, Shield, ShieldCheck } from 'lucide-react';

interface User {
    id: string;
    email: string;
    username: string;
    full_name: string;
    auth_provider: string;
    is_vendor: boolean;
    subscription_tier: string;
    created_at: string;
}

export default function Users() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetch('http://localhost:5001/api/users')
            .then(res => res.json())
            .then(data => {
                setUsers(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch users", err);
                setLoading(false);
            });
    }, []);

    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-300 to-indigo-100 inline-block drop-shadow-sm mb-1">
                        Users Management
                    </h1>
                    <p className="text-slate-400 text-sm">View and manage all registered accounts on Real Dream.</p>
                </div>

                <div className="relative group w-full sm:w-72">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={16} className="text-slate-500 group-focus-within:text-brand-400 transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="w-full bg-slate-900/50 border border-slate-700/50 text-slate-200 text-sm rounded-lg focus:ring-brand-500/50 focus:border-brand-500 block pl-9 p-2.5 placeholder-slate-500 transition-all outline-none"
                        placeholder="Search by name or email..."
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
                                <th scope="col" className="px-6 py-4 font-medium tracking-wider">User</th>
                                <th scope="col" className="px-6 py-4 font-medium tracking-wider">Role</th>
                                <th scope="col" className="px-6 py-4 font-medium tracking-wider">Tier</th>
                                <th scope="col" className="px-6 py-4 font-medium tracking-wider">Auth</th>
                                <th scope="col" className="px-6 py-4 font-medium tracking-wider">Joined</th>
                                <th scope="col" className="px-6 py-4 font-medium tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500 animate-pulse">
                                        Loading users...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        No users found matching "{searchTerm}"
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg">
                                                    {user.username?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-200">{user.full_name || user.username}</div>
                                                    <div className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                                                        <Mail size={10} />
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.is_vendor ? (
                                                <span className="flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-400/10 px-2 py-1 rounded-md w-fit border border-amber-400/20">
                                                    <ShieldCheck size={14} />
                                                    Vendor
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-300 bg-slate-800 px-2 py-1 rounded-md w-fit border border-slate-700">
                                                    <Shield size={14} />
                                                    User
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 capitalize font-medium text-slate-400 text-xs">
                                            {user.subscription_tier || 'Free'}
                                        </td>
                                        <td className="px-6 py-4 capitalize text-slate-400 text-xs">
                                            {user.auth_provider || 'Email'}
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 text-xs whitespace-nowrap">
                                            {new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-brand-400 hover:text-brand-300 hover:bg-brand-400/10 px-3 py-1.5 rounded transition-colors text-xs font-medium border border-transparent hover:border-brand-500/30">
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="bg-slate-900/50 border-t border-slate-800 p-4 text-xs text-slate-500 flex justify-between items-center">
                    <span>Showing {filteredUsers.length} users</span>
                </div>
            </div>
        </div>
    );
}
