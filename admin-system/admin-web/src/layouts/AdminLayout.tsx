import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function AdminLayout() {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 25, stiffness: 150 };
    const glowX = useSpring(mouseX, springConfig);
    const glowY = useSpring(mouseY, springConfig);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX - 300);
            mouseY.set(e.clientY - 300);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [mouseX, mouseY]);

    return (
        <div className="flex h-screen w-full bg-[#0a0f1a] overflow-hidden selection:bg-brand-500/30">
            {/* Background Glows */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-brand-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute top-[40%] -right-[15%] w-[40%] h-[60%] bg-indigo-600/5 rounded-full blur-[120px]"></div>
            </div>

            {/* Interactive Cursor Glow */}
            <motion.div 
                className="fixed w-[600px] h-[600px] rounded-full pointer-events-none z-50 opacity-40 blur-[100px]"
                style={{
                    left: glowX,
                    top: glowY,
                    background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.1) 40%, transparent 70%)',
                }}
            />

            {/* Ambient Background Pulse */}
            <motion.div 
                animate={{ 
                    opacity: [0.4, 0.7, 0.4],
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, 0]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="fixed inset-0 pointer-events-none -z-20 bg-gradient-to-tr from-brand-900/20 via-transparent to-indigo-900/20"
            />

            <Sidebar />

            <main className="flex-1 ml-64 h-full overflow-y-auto px-10 py-8 custom-scrollbar">
                <Outlet />
            </main>
        </div>
    );
}
