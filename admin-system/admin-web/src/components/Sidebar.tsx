import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    MoonStar,
    MessageSquare,
    Bell,
    ShoppingCart,
    Image as ImageIcon,
    LogOut,
    Settings
} from 'lucide-react';

const MENU_ITEMS = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { label: 'Users', icon: Users, href: '/users' },
    { label: 'Dreams', icon: MoonStar, href: '/dreams' },
    { label: 'Social', icon: MessageSquare, href: '/social' },
    { label: 'Notifications', icon: Bell, href: '/notifications' },
    { label: 'Marketplace', icon: ShoppingCart, href: '/marketplace' },
    { label: 'Gallery', icon: ImageIcon, href: '/gallery' },
    { label: 'Settings', icon: Settings, href: '/settings' },
];

export function Sidebar() {
    return (
        <aside className="w-64 h-screen bg-slate-900/80 backdrop-blur-xl border-r border-slate-800 flex flex-col pt-6 z-50 fixed left-0 top-0">
            <div className="px-6 mb-8 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-500 to-indigo-500 flex items-center justify-center">
                    <MoonStar size={18} className="text-white" />
                </div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-300 to-slate-100 mt-1 drop-shadow-sm tracking-tight">
                    Real Dream
                </h1>
            </div>

            <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto pb-4 custom-scrollbar">
                {MENU_ITEMS.map((item) => (
                    <NavLink
                        key={item.href}
                        to={item.href}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 capitalize font-medium ${isActive
                                ? 'bg-brand-500/10 text-brand-300 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.2)]'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                            }`
                        }
                    >
                        <item.icon size={18} className="opacity-80" strokeWidth={2.5} />
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <button className="flex w-full items-center gap-3 px-3 py-3 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors font-medium">
                    <LogOut size={18} />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
