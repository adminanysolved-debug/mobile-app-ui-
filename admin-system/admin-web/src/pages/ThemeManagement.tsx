import React, { useEffect, useState } from 'react';
import { Search, Palette, CheckCircle2, Circle, X, Trash2, Plus, Edit2 } from 'lucide-react';

interface Theme {
    id: string;
    name: string;
    is_premium: boolean;
    price: number;
    colors: any;
    is_active: boolean;
    created_at: string;
}

export default function ThemeManagement() {
    const [themes, setThemes] = useState<Theme[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [themeForm, setThemeForm] = useState<Partial<Theme>>({
        name: '',
        is_premium: false,
        price: 0,
        colors: {
            backgroundRoot: '#0D0B1E',
            backgroundDefault: '#16142E',
            accent: '#6366f1',
            text: '#FFFFFF',
            textSecondary: '#C4B5FD',
            border: '#2A264F',
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            purple: '#8b5cf6',
            blue: '#3b82f6',
            gradient: ['#6366f1', '#8b5cf6']
        },
        is_active: true
    });

    useEffect(() => {
        fetchThemes();
    }, []);

    const fetchThemes = () => {
        setLoading(true);
        fetch('http://localhost:5001/api/admin/themes', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
            }
        })
            .then(res => res.json())
            .then(data => {
                setThemes(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch themes", err);
                setLoading(false);
            });
    };

    const handleCreateTheme = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5001/api/admin/themes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
                },
                body: JSON.stringify(themeForm)
            });

            if (res.ok) {
                fetchThemes();
                setIsAdding(false);
                resetForm();
            } else {
                alert('Failed to create theme');
            }
        } catch (error) {
            console.error('Error creating theme:', error);
        }
    };

    const handleUpdateTheme = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTheme) return;

        try {
            const res = await fetch(`http://localhost:5001/api/admin/themes/${selectedTheme.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
                },
                body: JSON.stringify(themeForm)
            });

            if (res.ok) {
                fetchThemes();
                setIsEditing(false);
                setSelectedTheme(null);
                resetForm();
            } else {
                alert('Failed to update theme');
            }
        } catch (error) {
            console.error('Error updating theme:', error);
        }
    };

    const handleDeleteTheme = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete the theme "${name}"?`)) return;

        try {
            const res = await fetch(`http://localhost:5001/api/admin/themes/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
                }
            });

            if (res.ok) {
                fetchThemes();
            } else {
                alert('Failed to delete theme');
            }
        } catch (error) {
            console.error('Error deleting theme:', error);
        }
    };

    const toggleThemeStatus = async (theme: Theme) => {
        try {
            const res = await fetch(`http://localhost:5001/api/admin/themes/${theme.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
                },
                body: JSON.stringify({ 
                    ...theme,
                    is_active: !theme.is_active 
                })
            });

            if (res.ok) fetchThemes();
        } catch (error) { console.error(error); }
    };

    const resetForm = () => {
        setThemeForm({
            name: '',
            is_premium: false,
            price: 0,
            colors: {
                backgroundRoot: '#0D0B1E',
                backgroundDefault: '#16142E',
                accent: '#6366f1',
                text: '#FFFFFF',
                textSecondary: '#C4B5FD',
                border: '#2A264F',
                success: '#10b981',
                error: '#ef4444',
                warning: '#f59e0b',
                purple: '#8b5cf6',
                blue: '#3b82f6',
                gradient: ['#6366f1', '#8b5cf6']
            },
            is_active: true
        });
    };

    const filteredThemes = themes.filter(t =>
        t.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleColorChange = (key: string, value: any) => {
        setThemeForm(prev => ({
            ...prev,
            colors: {
                ...prev.colors,
                [key]: value
            }
        }));
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-300 to-indigo-100 inline-block drop-shadow-sm mb-1">
                        Theme Management
                    </h1>
                    <p className="text-slate-400 text-sm">Create and control application themes globally.</p>
                </div>

                <div className="flex gap-4 w-full sm:w-auto">
                    <div className="relative group flex-1 sm:w-72">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={16} className="text-slate-500 group-focus-within:text-brand-400 transition-colors" />
                        </div>
                        <input
                            type="text"
                            className="w-full bg-slate-900/50 border border-slate-700/50 text-slate-200 text-sm rounded-lg focus:ring-brand-500/50 focus:border-brand-500 block pl-9 p-2.5 placeholder-slate-500 transition-all outline-none"
                            placeholder="Search themes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => { setIsAdding(true); resetForm(); }}
                        className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-bold text-sm transition-all shadow-lg shadow-brand-600/20"
                    >
                        <Plus size={18} /> Add Theme
                    </button>
                </div>
            </div>

            <div className="glass-card flex-1 overflow-hidden flex flex-col relative shadow-xl shadow-black/20">
                <div className="overflow-x-auto flex-1 custom-scrollbar">
                    <table className="w-full text-sm text-left text-slate-300">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-900/80 sticky top-0 z-10 border-b border-slate-700/50 backdrop-blur-md">
                            <tr>
                                <th scope="col" className="px-6 py-4 font-medium tracking-wider">Theme Name</th>
                                <th scope="col" className="px-6 py-4 font-medium tracking-wider">Preview</th>
                                <th scope="col" className="px-6 py-4 font-medium tracking-wider">Type</th>
                                <th scope="col" className="px-6 py-4 font-medium tracking-wider">Price</th>
                                <th scope="col" className="px-6 py-4 font-medium tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-4 font-medium tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500 animate-pulse">
                                        Loading themes...
                                    </td>
                                </tr>
                            ) : filteredThemes.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        No themes found matching "{searchTerm}"
                                    </td>
                                </tr>
                            ) : (
                                filteredThemes.map((theme) => (
                                    <tr key={theme.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
                                                    <Palette size={18} />
                                                </div>
                                                <div className="font-medium text-slate-200">{theme.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-1">
                                                <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: theme.colors.primary }} />
                                                <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: theme.colors.backgroundRoot }} />
                                                <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: theme.colors.accent }} />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {theme.is_premium ? (
                                                <span className="text-[10px] text-amber-400 border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Premium</span>
                                            ) : (
                                                <span className="text-[10px] text-slate-400 border border-slate-700 bg-slate-800 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Free</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-brand-300">{theme.price > 0 ? `${theme.price} Coins` : '-'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button 
                                                onClick={() => toggleThemeStatus(theme)}
                                                className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border transition-all ${theme.is_active ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : 'text-slate-400 border-slate-700 bg-slate-800'}`}
                                            >
                                                {theme.is_active ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                                                {theme.is_active ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedTheme(theme);
                                                    setThemeForm(theme);
                                                    setIsEditing(true);
                                                }}
                                                className="text-brand-400 hover:text-brand-300 hover:bg-brand-400/10 px-3 py-1.5 rounded transition-colors text-xs font-medium border border-transparent hover:border-brand-500/30"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTheme(theme.id, theme.name)}
                                                className="text-red-400 hover:text-red-300 hover:bg-red-400/10 px-3 py-1.5 rounded transition-colors text-xs font-medium border border-transparent hover:border-red-500/30"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Theme Form Modal (Add/Edit) */}
                {(isAdding || isEditing) && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => { setIsAdding(false); setIsEditing(false); setSelectedTheme(null); }}>
                        <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-xl w-full max-w-2xl overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900/50">
                                <h3 className="text-lg font-semibold text-slate-200">{isAdding ? 'Create New Theme' : 'Edit Theme'}</h3>
                                <button onClick={() => { setIsAdding(false); setIsEditing(false); setSelectedTheme(null); }} className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={isAdding ? handleCreateTheme : handleUpdateTheme} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-slate-400 ml-1 uppercase tracking-widest">Theme Name</label>
                                            <input 
                                                type="text" 
                                                required
                                                value={themeForm.name} 
                                                onChange={e => setThemeForm({...themeForm, name: e.target.value})}
                                                placeholder="e.g. Neon Nights"
                                                className="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-lg text-slate-200 text-sm focus:border-brand-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-slate-400 ml-1 uppercase tracking-widest">Price (Coins)</label>
                                                <input 
                                                    type="number" 
                                                    value={themeForm.price} 
                                                    onChange={e => setThemeForm({...themeForm, price: parseInt(e.target.value)})}
                                                    className="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-lg text-slate-200 text-sm focus:border-brand-500 outline-none transition-all"
                                                />
                                            </div>
                                            <div className="flex flex-col justify-end gap-3 pb-1">
                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={themeForm.is_premium} 
                                                        onChange={e => setThemeForm({...themeForm, is_premium: e.target.checked})}
                                                        className="rounded border-slate-700 bg-slate-800 text-brand-500 focus:ring-brand-500/20"
                                                    />
                                                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Premium</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={themeForm.is_active} 
                                                        onChange={e => setThemeForm({...themeForm, is_active: e.target.checked})}
                                                        className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500/20"
                                                    />
                                                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Active</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Color Editor */}
                                    <div className="space-y-4">
                                        <label className="text-xs font-medium text-slate-400 ml-1 uppercase tracking-widest">Color Palette</label>
                                        <div className="grid grid-cols-2 gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                            {Object.entries(themeForm.colors || {}).map(([key, value]) => {
                                                if (key === 'gradient' && Array.isArray(value)) {
                                                    return (
                                                        <div key={key} className="col-span-2 space-y-2 border-t border-slate-700 pt-2 mt-2">
                                                            <label className="text-[10px] text-slate-500 font-bold uppercase">Gradient Pair</label>
                                                            <div className="flex gap-2">
                                                                {value.map((color, i) => (
                                                                    <input 
                                                                        key={i}
                                                                        type="color" 
                                                                        value={color}
                                                                        onChange={e => {
                                                                            const newGrad = [...value];
                                                                            newGrad[i] = e.target.value;
                                                                            handleColorChange('gradient', newGrad);
                                                                        }}
                                                                        className="w-10 h-10 rounded border-none bg-transparent cursor-pointer"
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <div key={key} className="flex flex-col gap-1.5">
                                                        <label className="text-[10px] text-slate-500 font-bold uppercase truncate">{key.replace(/([A-Z])/g, ' $1')}</label>
                                                        <div className="flex items-center gap-2">
                                                            <input 
                                                                type="color" 
                                                                value={value as string}
                                                                onChange={e => handleColorChange(key, e.target.value)}
                                                                className="w-8 h-8 rounded border-none bg-transparent cursor-pointer"
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="pt-6 flex gap-3 border-t border-slate-800">
                                    <button type="submit" className="flex-1 bg-brand-600 hover:bg-brand-500 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-brand-600/20">
                                        {isAdding ? 'Create Theme' : 'Update Theme'}
                                    </button>
                                    <button type="button" onClick={() => { setIsAdding(false); setIsEditing(false); setSelectedTheme(null); }} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-bold text-sm transition-all">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
