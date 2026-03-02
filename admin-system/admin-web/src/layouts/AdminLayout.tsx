import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';

export default function AdminLayout() {
    return (
        <div className="flex h-screen w-full bg-[#0a0f1a] overflow-hidden selection:bg-brand-500/30">
            {/* Background Glows */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-brand-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute top-[40%] -right-[15%] w-[40%] h-[60%] bg-indigo-600/5 rounded-full blur-[120px]"></div>
            </div>

            <Sidebar />

            <main className="flex-1 ml-64 h-full overflow-y-auto px-10 py-8 custom-scrollbar">
                <Outlet />
            </main>
        </div>
    );
}
