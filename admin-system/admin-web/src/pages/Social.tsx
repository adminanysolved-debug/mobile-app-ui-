import { useEffect, useState } from 'react';
import { Search, MessageSquare, Heart, Trash2, X, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../lib/config';

interface FeedPost {
    id: string;
    content: string;
    likes: number;
    comments: number;
    created_at: string;
    username: string;
    dream_title: string;
}

interface Comment {
    id: string;
    content: string;
    username: string;
    created_at: string;
}

export default function Social() {
    const [posts, setPosts] = useState<FeedPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);

    const fetchPosts = () => {
        setLoading(true);
        fetch(`${API_BASE_URL}/api/newsfeed`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}` }
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
                    setPosts(data);
                } else {
                    setPosts([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch news feed", err);
                setLoading(false);
                setPosts([]);
            });
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleDeletePost = async (id: string) => {
        if (!window.confirm('Terminate this broadcast transmission? This action is irreversible.')) return;
        
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/posts/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}` }
            });
            if (res.ok) {
                setPosts(posts.filter(p => p.id !== id));
            }
        } catch (err) {
            console.error("Failed to delete post", err);
        }
    };

    const fetchComments = async (postId: string) => {
        setLoadingComments(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/posts/${postId}/comments`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}` }
            });
            const data = await res.json();
            setComments(data);
        } catch (err) {
            console.error("Failed to fetch comments", err);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!window.confirm('Redact this comment permanently?')) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/comments/${commentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}` }
            });
            if (res.ok) {
                setComments(comments.filter(c => c.id !== commentId));
                // Update post comment count locally
                if (selectedPost) {
                    setPosts(posts.map(p => p.id === selectedPost.id ? { ...p, comments: p.comments - 1 } : p));
                }
            }
        } catch (err) {
            console.error("Failed to delete comment", err);
        }
    };

    const filteredPosts = posts.filter(p =>
        p.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 inline-block drop-shadow-sm mb-1 uppercase tracking-tighter">
                        Feed Moderation
                    </h1>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Global Broadcast Suppression & Oversight</p>
                </div>

                <div className="relative group w-full sm:w-72">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={16} className="text-slate-500 group-focus-within:text-brand-400 transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="w-full bg-slate-900/50 border border-white/5 text-slate-200 text-sm rounded-xl focus:ring-brand-500/50 focus:border-brand-500 block pl-9 p-3 placeholder-slate-600 transition-all outline-none"
                        placeholder="Search broadcast content..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="glass-card flex-1 overflow-hidden flex flex-col relative border border-white/5 shadow-2xl">
                <div className="overflow-x-auto flex-1 custom-scrollbar">
                    <table className="w-full text-sm text-left text-slate-300">
                        <thead className="text-[10px] text-slate-500 uppercase bg-black/40 sticky top-0 z-10 border-b border-white/5 backdrop-blur-xl">
                            <tr>
                                <th scope="col" className="px-6 py-4 font-black tracking-[0.2em]">Author</th>
                                <th scope="col" className="px-6 py-4 font-black tracking-[0.2em]">Broadcast Content</th>
                                <th scope="col" className="px-6 py-4 font-black tracking-[0.2em]">Context</th>
                                <th scope="col" className="px-6 py-4 font-black tracking-[0.2em]">Engagement</th>
                                <th scope="col" className="px-6 py-4 font-black tracking-[0.2em] text-right">Moderation</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-600 animate-pulse font-bold uppercase tracking-widest">
                                        Synchronizing Data...
                                    </td>
                                </tr>
                            ) : filteredPosts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-600 font-bold uppercase tracking-widest">
                                        No matching signals detected
                                    </td>
                                </tr>
                            ) : (
                                filteredPosts.map((post) => (
                                    <tr key={post.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-200 tracking-tight">@{post.username}</span>
                                                <span className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter mt-1">
                                                    {new Date(post.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="text-slate-400 line-clamp-2 text-xs leading-relaxed max-w-md">
                                                {post.content}
                                            </p>
                                        </td>
                                        <td className="px-6 py-5">
                                            {post.dream_title ? (
                                                <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 font-black uppercase tracking-tighter">
                                                    {post.dream_title}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-slate-700 font-black uppercase tracking-tighter">Independent</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-rose-500/5 border border-rose-500/10">
                                                    <Heart size={12} className="text-rose-500" /> 
                                                    <span className="text-[10px] font-black text-rose-400">{post.likes}</span>
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        setSelectedPost(post);
                                                        fetchComments(post.id);
                                                    }}
                                                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-sky-500/5 border border-sky-500/10 hover:bg-sky-500/10 transition-colors"
                                                >
                                                    <MessageSquare size={12} className="text-sky-400" /> 
                                                    <span className="text-[10px] font-black text-sky-400">{post.comments}</span>
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => {
                                                        setSelectedPost(post);
                                                        fetchComments(post.id);
                                                    }}
                                                    className="p-2 text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 rounded-xl transition-all border border-transparent hover:border-brand-500/20"
                                                >
                                                    <MessageSquare size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeletePost(post.id)}
                                                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Comment Moderation Modal */}
            <AnimatePresence>
                {selectedPost && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedPost(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-2xl bg-[#0a0f1e] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                        >
                            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-sky-500/10 rounded-xl border border-sky-500/20">
                                        <MessageSquare size={20} className="text-sky-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-100 tracking-tight">Comment Oversight</h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Managing Post ID: {selectedPost.id.split('-')[0]}...</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedPost(null)}
                                    className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 bg-white/[0.01] border-b border-white/5">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-[10px] font-black uppercase text-brand-500 tracking-widest bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">Original Content</span>
                                </div>
                                <p className="text-sm text-slate-300 leading-relaxed italic border-l-2 border-brand-500/30 pl-4 py-1">
                                    "{selectedPost.content}"
                                </p>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                {loadingComments ? (
                                    <div className="py-12 text-center text-slate-600 font-black uppercase tracking-widest animate-pulse">
                                        Decoding encrypted chatter...
                                    </div>
                                ) : comments.length === 0 ? (
                                    <div className="py-12 text-center text-slate-700 font-black uppercase tracking-widest flex flex-col items-center gap-4">
                                        No verbal signals detected
                                    </div>
                                ) : (
                                    comments.map((comment) => (
                                        <motion.div
                                            key={comment.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex items-start justify-between group"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-black text-slate-200">@{comment.username}</span>
                                                    <span className="text-[9px] text-slate-600 font-bold">
                                                        {new Date(comment.created_at).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-400 leading-relaxed">{comment.content}</p>
                                            </div>
                                            <button 
                                                onClick={() => handleDeleteComment(comment.id)}
                                                className="ml-4 p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-red-500/20"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </motion.div>
                                    ))
                                )}
                            </div>

                            <div className="p-4 bg-slate-900/50 border-t border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-[9px] font-black text-slate-600 uppercase tracking-widest">
                                    <ShieldAlert size={12} className="text-slate-700" />
                                    Security Level: Admin Oversight
                                </div>
                                <span className="text-[9px] font-black text-brand-500/50 uppercase tracking-widest">RealDream Neural Matrix</span>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
