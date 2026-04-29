import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Trash2, ShieldCheck, AlertCircle, ShoppingCart } from 'lucide-react';

export function Checkout() {
  const { cart, removeFromCart, total, clearCart } = useCart();
  const { user, login, loginWithGoogle } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Resolve username to email if needed
      let loginEmail = email;
      if (!email.includes('@')) {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/resolve-username`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: email })
        });
        if (res.ok) {
          const data = await res.json();
          loginEmail = data.email;
        } else {
          throw new Error('Username not found');
        }
      }

      await login(loginEmail, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      // Call your backend to process the purchase
      // Currently using a mock timeout since the backend endpoint might need to be created
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSuccess(true);
      clearCart();
    } catch (err) {
      setError('Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen pt-32 px-6 flex items-center justify-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass p-12 rounded-3xl text-center max-w-md">
          <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Purchase Successful!</h2>
          <p className="text-textSecondary mb-8">
            Your dreams have been securely synced to your Real Dream APK. Open the app to experience them tonight!
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Cart Summary */}
        <div>
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
            <ShoppingCart className="text-accent" /> Your Cart
          </h2>
          
          {cart.length === 0 ? (
            <div className="glass p-8 rounded-3xl text-center">
              <p className="text-textSecondary">Your cart is currently empty.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <motion.div layout key={item.id} className="glass p-4 rounded-2xl flex items-center gap-4">
                  <img src={item.image} alt={item.title} className="w-20 h-20 rounded-xl object-cover" />
                  <div className="flex-1">
                    <h4 className="font-bold">{item.title}</h4>
                    <p className="text-sm text-textSecondary">{item.price} Coins</p>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="p-3 text-error/70 hover:text-error hover:bg-error/10 rounded-full transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
              
              <div className="glass p-6 rounded-2xl mt-8 flex justify-between items-center">
                <span className="text-xl font-bold text-textSecondary">Total</span>
                <span className="text-3xl font-bold text-gradient">{total} Coins</span>
              </div>
            </div>
          )}
        </div>

        {/* Auth / Checkout Panel */}
        <div>
          <div className="glass-dark p-8 rounded-3xl sticky top-28 border border-accent/20">
            {!user ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h3 className="text-2xl font-bold mb-2">Sign in to Checkout</h3>
                <p className="text-textSecondary mb-8 text-sm">Use your existing Real Dream APK credentials to securely sync your purchases.</p>
                
                {error && (
                  <div className="bg-error/20 text-error p-3 rounded-lg mb-6 flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <input 
                      type="text" 
                      placeholder="Username or Email" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <input 
                      type="password" 
                      placeholder="Password" 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent transition-colors"
                      required
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-4 rounded-xl bg-accent hover:bg-pink text-white font-bold transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Authenticating...' : 'Sign In'}
                  </button>
                </form>

                <div className="mt-6 flex items-center justify-between text-sm text-textSecondary">
                  <div className="w-full h-px bg-white/10" />
                  <span className="px-4">OR</span>
                  <div className="w-full h-px bg-white/10" />
                </div>

                <button 
                  onClick={loginWithGoogle}
                  className="w-full mt-6 py-4 rounded-xl glass hover:bg-white/10 border border-white/20 font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  Continue with Google
                </button>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center gap-4 mb-8 bg-accent/20 p-4 rounded-2xl border border-accent/30">
                  <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                    <Sparkles className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-textSecondary">Logged in as</p>
                    <p className="font-bold text-lg">{user.username || user.email}</p>
                  </div>
                </div>

                <button 
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || loading}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-accent to-pink text-white font-bold text-lg hover:shadow-[0_0_30px_rgba(236,72,153,0.4)] transition-all disabled:opacity-50 hover:scale-[1.02]"
                >
                  {loading ? 'Processing...' : `Confirm Purchase • ${total} Coins`}
                </button>
              </motion.div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
