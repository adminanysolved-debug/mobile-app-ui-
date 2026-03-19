import React, { useEffect, useState } from 'react';
import { Megaphone, ExternalLink, Image as ImageIcon, Save, CheckCircle2, AlertCircle, TrendingUp, Upload } from 'lucide-react';
import { motion } from 'framer-motion';

interface AdSettings {
    id?: string;
    image_url: string;
    target_url: string;
    is_active: boolean;
    type: 'image' | 'video';
}

export default function Promotions() {
    const [ad, setAd] = useState<AdSettings>({
        image_url: '',
        target_url: '',
        is_active: true,
        type: 'image'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setMessage(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('http://localhost:5001/api/admin/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
                },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setAd(prev => ({ ...prev, image_url: data.url }));
                setMessage({ type: 'success', text: 'File uploaded successfully!' });
            } else {
                throw new Error('Upload failed');
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to upload file. Please try again.' });
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        fetchAd();
    }, []);

    const fetchAd = async () => {
        try {
            const res = await fetch('http://localhost:5001/api/admin/ads', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}` }
            });
            const data = await res.json();
            if (data) {
                setAd({
                    id: data.id,
                    image_url: data.image_url || '',
                    target_url: data.target_url || '',
                    is_active: data.is_active ?? true,
                    type: data.type || 'image'
                });
            }
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch ad settings", err);
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch('http://localhost:5001/api/admin/ads', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
                },
                body: JSON.stringify({
                    imageUrl: ad.image_url,
                    targetUrl: ad.target_url,
                    isActive: ad.is_active,
                    type: ad.type
                })
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Promotional ad updated successfully!' });
                fetchAd();
            } else {
                throw new Error('Failed to update');
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to update ad. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-12 h-12 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
        </div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-10">
            <header>
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <h1 className="text-4xl font-black text-slate-100 tracking-tighter">Promotions</h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em] mt-3 flex items-center gap-2">
                        <Megaphone size={12} className="text-brand-500" />
                        Global App Popup Ad System
                    </p>
                </motion.div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Configuration Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-8 border border-white/5 space-y-8"
                >
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                            <Megaphone size={20} className="text-brand-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-100 tracking-tight">Ad Configuration</h3>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Update global settings</p>
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Ad Media Type</label>
                            <div className="flex gap-4">
                                {['image', 'video'].map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setAd({ ...ad, type: t as any })}
                                        className={`flex-1 py-3 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${ad.type === t ? 'bg-brand-600 border-brand-400 text-white shadow-lg shadow-brand-600/20' : 'bg-slate-900/50 border-white/5 text-slate-500 hover:border-white/10'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                                {ad.type === 'video' ? 'Video URL or Upload' : 'Image URL or Upload'}
                            </label>
                            <div className="flex gap-2">
                                <div className="relative group flex-1">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <ImageIcon size={14} className="text-slate-600 group-focus-within:text-brand-400 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        value={ad.image_url}
                                        onChange={(e) => setAd({ ...ad, image_url: e.target.value })}
                                        className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-200 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all font-medium"
                                        placeholder={ad.type === 'video' ? "https://example.com/video.mp4" : "https://example.com/image.jpg"}
                                        required
                                    />
                                </div>
                                
                                <label className="flex items-center justify-center bg-slate-800 hover:bg-slate-700 border border-white/5 rounded-xl px-4 cursor-pointer transition-colors group">
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        accept={ad.type === 'video' ? 'video/mp4,video/quicktime' : 'image/jpeg,image/png,image/gif,image/webp'}
                                        onChange={handleFileUpload}
                                        disabled={uploading}
                                    />
                                    {uploading ? (
                                        <div className="w-5 h-5 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                                    ) : (
                                        <Upload size={18} className="text-slate-400 group-hover:text-brand-400 transition-colors" />
                                    )}
                                </label>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Target Link (Optional)</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <ExternalLink size={14} className="text-slate-600 group-focus-within:text-brand-400 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    value={ad.target_url}
                                    onChange={(e) => setAd({ ...ad, target_url: e.target.value })}
                                    className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-200 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all font-medium"
                                    placeholder="Deep link or external URL"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">Active Status</span>
                                <span className="text-[9px] text-slate-500 uppercase tracking-tighter mt-1">Show ad to all mobile users</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setAd({ ...ad, is_active: !ad.is_active })}
                                className={`w-12 h-6 rounded-full transition-all relative ${ad.is_active ? 'bg-brand-600 shadow-[0_0_15px_-3px_rgba(99,102,241,0.6)]' : 'bg-slate-800'}`}
                            >
                                <motion.div
                                    animate={{ x: ad.is_active ? 26 : 2 }}
                                    className="absolute top-1 left-0 w-4 h-4 rounded-full bg-white shadow-sm"
                                />
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-black py-4 rounded-xl shadow-xl shadow-brand-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
                        >
                            {saving ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save size={18} className="group-hover:scale-110 transition-transform" />
                                    <span>Sync Settings Across Network</span>
                                </>
                            )}
                        </button>
                    </form>

                    {message && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-4 rounded-xl border flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}
                        >
                            {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                            <span className="text-xs font-black uppercase tracking-widest">{message.text}</span>
                        </motion.div>
                    )}
                </motion.div>

                {/* Preview Panel */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col gap-6"
                >
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                            <TrendingUp size={20} className="text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-100 tracking-tight">Live Preview</h3>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Mobile aspect ratio</p>
                        </div>
                    </div>

                    <div className="relative mx-auto w-[280px] aspect-[9/16] bg-slate-900 rounded-[3rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden flex flex-col items-center justify-center p-6 text-center">
                        {ad.image_url ? (
                            <div className="relative w-full h-full group">
                                {ad.type === 'video' ? (
                                    <video
                                        src={ad.image_url}
                                        className="w-full h-full object-cover rounded-2xl opacity-80"
                                        autoPlay
                                        muted
                                        loop
                                    />
                                ) : (
                                    <img
                                        src={ad.image_url}
                                        alt="Ad Preview"
                                        className="w-full h-full object-cover rounded-2xl opacity-80"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/280x500?text=Invalid+Image+URL';
                                        }}
                                    />
                                )}
                                <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20">
                                    <div className="w-4 h-4 text-white font-bold text-[10px]">X</div>
                                </div>
                                {!ad.is_active && (
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                        <span className="text-red-500 font-black text-[10px] uppercase tracking_widest border border-red-500/20 px-3 py-1 rounded-full">Inactive</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4 opacity-30">
                                <ImageIcon size={48} className="mx-auto text-slate-600" />
                                <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest">No Image Configured</p>
                            </div>
                        )}
                    </div>
                    <p className="text-center text-[9px] text-slate-600 font-bold uppercase tracking-widest px-10 leading-relaxed">
                        This is a representative preview of the popup ad as it will appear on iOS & Android devices.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
