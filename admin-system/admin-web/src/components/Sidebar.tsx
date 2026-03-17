import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Briefcase,
    MoonStar,
    MessageSquare,
    Bell,
    ShoppingCart,
    Image as ImageIcon,
    LogOut,
    Settings,
    Shield,
    Activity
} from 'lucide-react';
import { motion } from 'framer-motion';

const MENU_ITEMS = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { label: 'Users', icon: Users, href: '/users' },
    { label: 'Vendors', icon: Briefcase, href: '/vendors' },
    { label: 'Dreams', icon: MoonStar, href: '/dreams' },
    { label: 'Feed', icon: MessageSquare, href: '/social' },
    { label: 'Notifications', icon: Bell, href: '/notifications' },
    { label: 'Marketplace', icon: ShoppingCart, href: '/marketplace' },
    { label: 'Gallery', icon: ImageIcon, href: '/gallery' },
    { label: 'Settings', icon: Settings, href: '/settings' },
];

export function Sidebar() {
    const navigate = useNavigate();
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/login');
    };

    return (
        <aside className="w-64 h-screen bg-[#030712] border-r border-white/5 flex flex-col pt-8 z-50 fixed left-0 top-0 overflow-hidden shadow-[10px_0_30px_-15px_rgba(0,0,0,0.5)]">
            {/* Sidebar Glow */}
            <div className="absolute top-0 left-0 w-32 h-64 bg-brand-600/5 blur-[80px] -z-10 pointer-events-none" />
            
            <div className="px-8 mb-10">
                <div className="flex items-center gap-4 group cursor-pointer">
                    <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-tr from-brand-600 to-indigo-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
                        <div className="relative w-11 h-11 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center shadow-2xl transition-transform group-hover:rotate-0 rotate-3">
                            <MoonStar size={22} className="text-brand-400 group-hover:scale-110 transition-transform" />
                        </div>
                    </div>
                    <div>
                         <h1 className="text-xl font-black text-slate-100 tracking-tighter leading-none">
                            RealDream Admin
                        </h1>
                        <div className="text-[9px] uppercase font-black text-brand-500 tracking-[0.4em] mt-1 opacity-70">Total App Control</div>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto pb-4 custom-scrollbar relative z-10">
                {MENU_ITEMS.map((item) => (
                    <NavLink
                        key={item.href}
                        to={item.href}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-bold group ${isActive
                                ? 'bg-brand-600/10 text-brand-400 border border-brand-500/20 shadow-[0_0_20px_-10px_rgba(99,102,241,0.5)]'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon size={18} className={`${isActive ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'} transition-opacity`} />
                                <span className="text-xs uppercase tracking-widest">{item.label}</span>
                                {isActive && (
                                    <motion.div 
                                        layoutId="sidebar-active"
                                        className="ml-auto w-1 h-3 bg-brand-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]" 
                                    />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>
            <div className="p-4 mt-auto">
                <div className="glass-card p-4 border border-white/5 bg-white/[0.02] rounded-2xl space-y-5">
                    {adminUser.email && (
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                            <div className="relative">
                                <Activity size={12} className="absolute -top-1 -right-1 text-emerald-500 animate-pulse" />
                                <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 overflow-hidden">
                                     <Shield size={16} className="text-slate-500" />
                                </div>
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[11px] font-black text-slate-200 truncate uppercase tracking-tight">{adminUser.fullName || 'Overseer'}</span>
                                <span className="text-[9px] font-bold text-slate-600 truncate uppercase tracking-tighter">Authorized</span>
                            </div>
                        </div>
                    )}
                    <button 
                        onClick={handleLogout}
                        className="flex w-full items-center justify-center gap-2 py-3 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all font-black text-[10px] uppercase tracking-widest group border border-transparent hover:border-red-500/20"
                    >
                        <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Log Out Session
                    </button>
                </div>
                <div className="mt-4 text-[8px] text-center text-slate-700 font-bold tracking-[0.3em] uppercase">V3.0.0 RealDream Admin</div>
            </div>
        </aside>
    );
}
