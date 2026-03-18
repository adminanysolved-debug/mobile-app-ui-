import { useEffect, useState } from 'react';
import { Search, ShoppingCart, CheckCircle2, Circle, X, Trash2 } from 'lucide-react';

interface MarketItem {
    id: string;
    title: string;
    category: string;
    price: number;
    is_premium: boolean;
    is_active: boolean;
    how_to_achieve?: string;
    created_at: string;
    vendor_name: string;
    vendor_tier: string;
}

export default function Marketplace() {
    const [items, setItems] = useState<MarketItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<MarketItem>>({});

    useEffect(() => {
        fetchMarketItems();
    }, []);

    const fetchMarketItems = () => {
        setLoading(true);
        fetch('http://localhost:5001/api/market-items', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
            }
        })
            .then(res => res.json())
            .then(data => {
                setItems(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch market items", err);
                setLoading(false);
            });
    };

    const handleDeleteItem = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete the market item "${title}"?\nThis action cannot be undone.`)) return;

        try {
            const res = await fetch(`http://localhost:5001/api/admin/market-items/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
                }
            });

            if (res.ok) {
                // Refresh the list after successful deletion
                fetchMarketItems();
                setSelectedItem(null);
            } else {
                const data = await res.json();
                alert(`Failed to delete item: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('An error occurred while deleting the item.');
        }
    };

    const filteredItems = items.filter(d =>
        d.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleUpdateItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem) return;

        try {
            const res = await fetch(`http://localhost:5001/api/admin/market-items/${selectedItem.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
                },
                body: JSON.stringify(editForm)
            });

            if (res.ok) {
                fetchMarketItems();
                setIsEditing(false);
                setSelectedItem(null);
            } else {
                alert('Failed to update item');
            }
        } catch (error) {
            console.error('Error updating item:', error);
        }
    };

    const toggleItemStatus = async (item: MarketItem) => {
        try {
            const res = await fetch(`http://localhost:5001/api/admin/market-items/${item.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
                },
                body: JSON.stringify({ 
                    ...item,
                    is_active: !item.is_active 
                })
            });

            if (res.ok) fetchMarketItems();
        } catch (error) { console.error(error); }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-300 to-indigo-100 inline-block drop-shadow-sm mb-1">
                        Marketplace Management
                    </h1>
                    <p className="text-slate-400 text-sm">Monitor and moderate all marketplace items.</p>
                </div>

                <div className="relative group w-full sm:w-72">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={16} className="text-slate-500 group-focus-within:text-brand-400 transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="w-full bg-slate-900/50 border border-slate-700/50 text-slate-200 text-sm rounded-lg focus:ring-brand-500/50 focus:border-brand-500 block pl-9 p-2.5 placeholder-slate-500 transition-all outline-none"
                        placeholder="Search items or vendors..."
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
                                <th scope="col" className="px-6 py-4 font-medium tracking-wider">Item Title</th>
                                <th scope="col" className="px-6 py-4 font-medium tracking-wider">Vendor</th>
                                <th scope="col" className="px-6 py-4 font-medium tracking-wider">Category</th>
                                <th scope="col" className="px-6 py-4 font-medium tracking-wider">Price/Premium</th>
                                <th scope="col" className="px-6 py-4 font-medium tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-4 font-medium tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500 animate-pulse">
                                        Loading market items...
                                    </td>
                                </tr>
                            ) : filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        No market items found matching "{searchTerm}"
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item) => (
                                    <tr key={item.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
                                                    <ShoppingCart size={18} />
                                                </div>
                                                <div className="font-medium text-slate-200">{item.title}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400">
                                            <div className="flex flex-col gap-1">
                                                <span>@{item.vendor_name || 'System Admin'}</span>
                                                {item.vendor_tier && (
                                                    <span className="capitalize text-[10px] text-brand-400 border border-brand-500/20 bg-brand-500/10 px-1 py-0.5 rounded w-fit">{item.vendor_tier} Tier</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="capitalize text-xs text-slate-300">{item.category || 'General'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-semibold text-brand-300">{item.price > 0 ? `${item.price} Coins` : 'Free'}</span>
                                                {item.is_premium && <span className="text-[10px] text-amber-400 uppercase tracking-widest font-bold">PREMIUM</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button 
                                                onClick={() => toggleItemStatus(item)}
                                                className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border transition-all ${item.is_active ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : 'text-slate-400 border-slate-700 bg-slate-800'}`}
                                            >
                                                {item.is_active ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                                                {item.is_active ? 'Active' : 'Hidden'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedItem(item);
                                                    setEditForm(item);
                                                    setIsEditing(true);
                                                }}
                                                className="text-brand-400 hover:text-brand-300 hover:bg-brand-400/10 px-3 py-1.5 rounded transition-colors text-xs font-medium border border-transparent hover:border-brand-500/30"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => setSelectedItem(item)}
                                                className="text-slate-400 hover:text-slate-200 hover:bg-white/5 px-3 py-1.5 rounded transition-colors text-xs font-medium border border-transparent"
                                            >
                                                Details
                                            </button>
                                            <button
                                                onClick={() => handleDeleteItem(item.id, item.title)}
                                                className="text-red-400 hover:text-red-300 hover:bg-red-400/10 px-3 py-1.5 rounded transition-colors text-xs font-medium border border-transparent hover:border-red-500/30"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Edit Item Modal */}
                {(selectedItem && isEditing) && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => { setIsEditing(false); setSelectedItem(null); }}>
                        <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-xl w-full max-w-md overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900/50">
                                <h3 className="text-lg font-semibold text-slate-200">Edit Marketplace Item</h3>
                                <button onClick={() => { setIsEditing(false); setSelectedItem(null); }} className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleUpdateItem} className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-400 ml-1">Title</label>
                                    <input 
                                        type="text" 
                                        value={editForm.title} 
                                        onChange={e => setEditForm({...editForm, title: e.target.value})}
                                        className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-slate-200 text-sm"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-slate-400 ml-1">Price (Coins)</label>
                                        <input 
                                            type="number" 
                                            value={editForm.price} 
                                            onChange={e => setEditForm({...editForm, price: parseInt(e.target.value)})}
                                            className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-slate-200 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-slate-400 ml-1">Category</label>
                                        <select 
                                            value={editForm.category} 
                                            onChange={e => setEditForm({...editForm, category: e.target.value})}
                                            className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-slate-200 text-sm"
                                        >
                                            <option value="Dream">Dream</option>
                                            <option value="Themes">Themes</option>
                                            <option value="Badges">Badges</option>
                                            <option value="Customization">Customization</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-400 ml-1">Achievement Steps (Protocol)</label>
                                    <textarea 
                                        value={editForm.how_to_achieve} 
                                        onChange={e => setEditForm({...editForm, how_to_achieve: e.target.value})}
                                        className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-slate-200 text-sm h-24"
                                    />
                                </div>
                                <div className="flex gap-4 pt-2">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input 
                                            type="checkbox" 
                                            checked={editForm.is_premium} 
                                            onChange={e => setEditForm({...editForm, is_premium: e.target.checked})}
                                            className="rounded border-slate-700 bg-slate-800 text-brand-500 focus:ring-brand-500/20"
                                        />
                                        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Premium Item</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input 
                                            type="checkbox" 
                                            checked={editForm.is_active} 
                                            onChange={e => setEditForm({...editForm, is_active: e.target.checked})}
                                            className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500/20"
                                        />
                                        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Active / Visible</span>
                                    </label>
                                </div>
                                
                                <div className="pt-4 flex gap-3">
                                    <button type="submit" className="flex-1 bg-brand-600 hover:bg-brand-500 text-white py-2 rounded-lg font-bold text-sm transition-all shadow-lg shadow-brand-600/20">
                                        Save Changes
                                    </button>
                                    <button type="button" onClick={() => { setIsEditing(false); setSelectedItem(null); }} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg font-bold text-sm transition-all">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* View Item Modal */}
                {(selectedItem && !isEditing) && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedItem(null)}>
                        <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-xl w-full max-w-md overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900/50">
                                <h3 className="text-lg font-semibold text-slate-200">Item Details</h3>
                                <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex items-center gap-4 border-b border-slate-800/50 pb-4">
                                    <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20 shadow-inner">
                                        <ShoppingCart size={32} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-slate-100">{selectedItem.title}</h4>
                                        <p className="text-brand-400 font-medium text-sm">Vendor: @{selectedItem.vendor_name || 'System'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                                    <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/50">
                                        <div className="text-slate-500 text-xs mb-1">Category</div>
                                        <div className="text-slate-200 capitalize">{selectedItem.category || 'General'}</div>
                                    </div>
                                    <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/50">
                                        <div className="text-slate-500 text-xs mb-1">Price</div>
                                        <div className="text-brand-300 font-bold">{selectedItem.price > 0 ? `${selectedItem.price} Coins` : 'Free'}</div>
                                    </div>
                                    <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/50">
                                        <div className="text-slate-500 text-xs mb-1">Premium Status</div>
                                        <div className="text-slate-200 capitalize">{selectedItem.is_premium ? <span className="text-amber-400 font-semibold">Premium</span> : 'Standard'}</div>
                                    </div>
                                    <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/50">
                                        <div className="text-slate-500 text-xs mb-1">Status</div>
                                        <div className="text-slate-200">
                                            {selectedItem.is_active ? (
                                                <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 size={12} /> Active</span>
                                            ) : (
                                                <span className="text-slate-400 flex items-center gap-1"><Circle size={12} /> Inactive</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/50 col-span-2">
                                        <div className="text-slate-500 text-xs mb-1">Item ID</div>
                                        <div className="text-slate-200 font-mono text-xs break-all">{selectedItem.id}</div>
                                    </div>
                                    <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/50 col-span-2">
                                        <div className="text-slate-500 text-xs mb-1">Created At</div>
                                        <div className="text-slate-200">{new Date(selectedItem.created_at).toLocaleString()}</div>
                                    </div>
                                    {selectedItem.how_to_achieve && (
                                        <div className="bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/20 col-span-2">
                                            <div className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                                Dream Achievement Protocol
                                            </div>
                                            <div className="text-slate-200 text-sm leading-relaxed italic">
                                                "{selectedItem.how_to_achieve}"
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-2">
                                <button onClick={() => { setIsEditing(true); setEditForm(selectedItem); }} className="px-4 py-2 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 rounded-lg transition-colors text-sm font-medium">
                                    Edit Details
                                </button>
                                <button onClick={() => handleDeleteItem(selectedItem.id, selectedItem.title)} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors text-sm font-medium flex items-center gap-2">
                                    <Trash2 size={16} /> Delete Item
                                </button>
                                <button onClick={() => setSelectedItem(null)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors text-sm font-medium">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
