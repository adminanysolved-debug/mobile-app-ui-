import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, User as UserIcon, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="fixed top-0 w-full z-50 glass border-b border-white/10 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ 
              y: [0, -5, 0],
              boxShadow: ["0 0 20px rgba(167,139,250,0.5)", "0 0 40px rgba(236,72,153,0.8)", "0 0 20px rgba(167,139,250,0.5)"]
            }}
            transition={{ 
              y: { repeat: Infinity, duration: 3, ease: "easeInOut" },
              boxShadow: { repeat: Infinity, duration: 2, ease: "easeInOut" }
            }}
            whileHover={{ 
              rotate: 360,
              scale: 1.1,
              transition: { duration: 0.8, ease: "easeInOut" }
            }}
            className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center shadow-[0_0_20px_rgba(236,72,153,0.5)] border border-white/20"
          >
            <img src="/logo.png" alt="Real Dream Logo" className="w-full h-full object-cover" />
          </motion.div>
          <span className="text-xl font-bold text-gradient tracking-wider">
            Real Dream
          </span>
        </Link>

        <div className="flex items-center gap-8">
          <Link to="/" className="text-foreground hover:text-pink transition-colors font-medium">
            Home
          </Link>
          <Link to="/marketplace" className="text-foreground hover:text-pink transition-colors font-medium">
            Marketplace
          </Link>

          <div className="flex items-center gap-4 ml-4">
            <Link to="/checkout" className="relative p-2 text-foreground hover:text-pink transition-colors">
              <ShoppingCart className="w-5 h-5" />
            </Link>

            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 glass px-4 py-2 rounded-full">
                  <UserIcon className="w-4 h-4 text-purple" />
                  <span className="text-sm font-medium">{user.username || user.email?.split('@')[0]}</span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-foreground hover:text-error transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link
                to="/checkout"
                className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 transition-all font-medium backdrop-blur-md"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
