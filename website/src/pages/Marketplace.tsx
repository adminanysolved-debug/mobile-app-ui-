import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import type { DreamItem } from '../context/CartContext';

// We'll use mock items until the API endpoint is fully exposed if it isn't already
const MOCK_ITEMS: DreamItem[] = [
  { id: 1, title: 'Lucid Flight', description: 'Experience the exhilarating sensation of uninhibited flight through neon clouds.', price: 500, category: 'Adventure', image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80' },
  { id: 2, title: 'Deep Ocean Serenity', description: 'Breathe underwater and explore vibrant, bioluminescent coral reefs.', price: 300, category: 'Relaxation', image: 'https://images.unsplash.com/photo-1551244072-5d12893278ab?w=800&q=80' },
  { id: 3, title: 'Cyberpunk Metropolis', description: 'Wander through a futuristic city with complete narrative control.', price: 750, category: 'Premium', image: 'https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?w=800&q=80' },
  { id: 4, title: 'Mountain Ascend', description: 'Conquer the highest peaks without the physical toll.', price: 200, category: 'Adventure', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80' },
];

export function Marketplace() {
  const { addToCart, cart } = useCart();
  const [items, setItems] = useState<DreamItem[]>(MOCK_ITEMS);

  useEffect(() => {
    // Attempt to fetch from the actual API
    fetch(`${import.meta.env.VITE_API_URL}/api/market/items`)
      .then(res => res.ok ? res.json() : MOCK_ITEMS)
      .then(data => {
        if (data && data.length > 0) setItems(data);
      })
      .catch(() => setItems(MOCK_ITEMS));
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">Dream Marketplace</h1>
            <p className="text-textSecondary text-lg max-w-2xl">
              Browse our curated collection of subconscious experiences. Add them to your cart now, and sign in later to sync them directly to your app.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, index) => {
            const inCart = cart.some(i => i.id === item.id);
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                key={item.id}
                className="glass-dark rounded-3xl overflow-hidden group border border-accent/20 shadow-[0_0_20px_rgba(167,139,250,0.1)] hover:shadow-[0_0_60px_rgba(236,72,153,0.6)] hover:border-pink/50 hover:-translate-y-2 transition-all duration-500"
              >
                <div className="h-48 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D0B1E] to-transparent z-10" />
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute top-4 right-4 z-20 px-3 py-1 glass rounded-full flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-bold">{item.price} Coins</span>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="text-xs font-bold text-accent uppercase tracking-wider mb-2">{item.category}</div>
                  <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                  <p className="text-textSecondary mb-6 line-clamp-2">{item.description}</p>
                  
                  <button
                    onClick={() => !inCart && addToCart(item)}
                    disabled={inCart}
                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                      inCart 
                        ? 'bg-white/10 text-white cursor-not-allowed' 
                        : 'bg-accent hover:bg-pink text-white hover:scale-[1.02]'
                    }`}
                  >
                    {inCart ? (
                      <>Added to Cart</>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        Add to Cart
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
