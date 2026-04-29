import { useMemo } from 'react';
import { motion } from 'framer-motion';

export function ParticlesBackground() {
  const particles = useMemo(() => {
    return Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 5 + 2,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 10,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
      {/* Deep Space Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple/20 rounded-full blur-[150px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink/20 rounded-full blur-[150px]" />
      <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] bg-accent/20 rounded-full blur-[120px]" />

      {/* Floating Orbs (Dreams) */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            opacity: 0,
            x: `${p.x}vw`,
            y: "110vh",
          }}
          animate={{
            opacity: [0, 0.6, 0],
            y: ["110vh", "-10vh"],
            x: [`${p.x}vw`, `${p.x + (Math.random() * 20 - 10)}vw`],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
          className="absolute rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]"
          style={{
            width: p.size,
            height: p.size,
          }}
        />
      ))}
    </div>
  );
}
