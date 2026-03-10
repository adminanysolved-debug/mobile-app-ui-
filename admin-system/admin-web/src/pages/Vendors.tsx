import { useEffect, useState } from 'react';
import { Search, Briefcase, CheckCircle2, Circle, ShieldBan, MoreVertical } from 'lucide-react';

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
                // Pre-filter so we're primarily seeing vendors, but keep search functional
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
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out h-full flex flex-col" onClick={() => setOpenMenuId(null)}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300 inline-block drop-shadow-sm mb-1">
                        Vendor Applications
                    </h1>
                    <p className="text-slate-400 text-sm">Manage business profiles and marketplace tiers.</p>
                </div>

                <div className="relative group w-full sm:w-72">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={16} className="text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="w-full bg-slate-900/50 border border-slate-700/50 text-slate-200 text-sm rounded-lg focus:ring-emerald-500/50 focus:border-emerald-500 block pl-9 p-2.5 placeholder-slate-500 transition-all outline-none"
                        placeholder="Search vendors..."
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
                                <th scope="col" className="px-6 py-4 font-medium tracking-wider">Business / User</th>
                                <th scope="col" className="px-6 py-4 font-medium tracking-wider">Contact</th>
                                <th scope="col" className="px-6 py-4 font-medium tracking-wider">Tier</th>
                                <th scope="col" className="px-6 py-4 font-medium tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-4 font-medium tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500 animate-pulse">
                                        Loading vendor data...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        No vendors found.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                                                    <Briefcase size={18} />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-200">{user.vendor_business_name || 'No Business Name'}</div>
                                                    <div className="text-xs text-slate-500">@{user.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-300">{user.email}</div>
                                            <div className="text-xs text-slate-500">{user.full_name || 'No Name Provided'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.vendor_tier ? (
                                                <span className="capitalize text-xs font-medium px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                                    {user.vendor_tier}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-500 italic">None</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.is_vendor ? (
                                                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full w-fit border border-emerald-500/20">
                                                    <CheckCircle2 size={12} /> Active Vendor
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full w-fit border border-amber-500/20">
                                                    <Circle size={12} /> Pending Approval
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenMenuId(openMenuId === user.id ? null : user.id);
                                                }}
                                                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                                            >
                                                <MoreVertical size={18} />
                                            </button>

                                            {openMenuId === user.id && (
                                                <div className="absolute right-8 top-10 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl py-1 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                                    {!user.is_vendor ? (
                                                        <button
                                                            onClick={() => handleUpdateVendorStatus(user.id, true, "basic")}
                                                            className="w-full text-left px-4 py-2 text-sm text-emerald-400 hover:bg-slate-700/50 flex items-center gap-2 transition-colors"
                                                        >
                                                            <CheckCircle2 size={14} /> Approve as Basic
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => handleUpdateVendorStatus(user.id, true, "premium")}
                                                                className="w-full text-left px-4 py-2 text-sm text-amber-400 hover:bg-slate-700/50 flex items-center gap-2 transition-colors border-b border-slate-700/50"
                                                            >
                                                                <Briefcase size={14} /> Upgrade to Premium
                                                            </button>
                                                            <button
                                                                onClick={() => handleUpdateVendorStatus(user.id, false, null)}
                                                                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors mt-1"
                                                            >
                                                                <ShieldBan size={14} /> Revoke Vendor Status
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
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
