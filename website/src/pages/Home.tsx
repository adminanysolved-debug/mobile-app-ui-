import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, Brain, Zap, Moon, Activity, Fingerprint, Lock } from 'lucide-react';

export function Home() {
  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <section className="min-h-[80vh] flex flex-col items-center justify-center text-center relative">
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink/20 rounded-full blur-[120px]" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-accent/30 text-accent mb-8">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium tracking-wide uppercase">Welcome to the Subconscious</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-bold mb-6 tracking-tight">
              Explore Your <br />
              <span className="text-gradient">Real Dream</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-textSecondary max-w-2xl mb-12">
              Step into a marketplace of the mind. Discover, acquire, and experience curated dreams tailored to your subconscious desires.
            </p>

            <div className="flex gap-4">
              <Link
                to="/marketplace"
                className="px-8 py-4 rounded-full bg-gradient-to-r from-accent to-pink text-white font-bold text-lg hover:shadow-[0_0_30px_rgba(236,72,153,0.4)] transition-all hover:scale-105"
              >
                Explore Marketplace
              </Link>
            </div>
          </motion.div>
        </section>

        {/* What is Real Dream Section */}
        <section className="py-24 relative">
          <div className="absolute top-1/2 right-0 w-96 h-96 bg-purple/10 rounded-full blur-[100px] -z-10" />
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <h2 className="text-4xl md:text-5xl font-bold mb-6">What is <span className="text-gradient">Real Dream?</span></h2>
                <p className="text-lg text-textSecondary mb-6 leading-relaxed">
                  Real Dream is the world's first interactive subconscious marketplace. It is not just an application; it is a gateway to programming your own mind. By utilizing our proprietary mobile APK, users can seamlessly transition from purchasing a dream online to experiencing it deeply during their REM sleep cycle.
                </p>
                <p className="text-lg text-textSecondary leading-relaxed">
                  Whether you are seeking thrilling adventures, deep relaxation, or a playground to conquer your fears, Real Dream gives you the tools to curate your nighttime reality.
                </p>
              </motion.div>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              <InfoCard icon={<Activity className="text-pink" />} title="Brainwave Sync" desc="Matches Delta frequencies." />
              <InfoCard icon={<Fingerprint className="text-accent" />} title="Biometric Security" desc="Your dreams are locked to you." />
              <InfoCard icon={<Moon className="text-blue-400" />} title="REM Optimization" desc="Increases dream vividness." />
              <InfoCard icon={<Lock className="text-yellow-400" />} title="Private Sandbox" desc="Absolute privacy guaranteed." />
            </div>
          </div>
        </section>

        {/* The Science of Subconscious Syncing */}
        <section className="py-24 relative">
          <div className="max-w-4xl mx-auto text-center glass-dark p-12 rounded-3xl border border-accent/20 shadow-[0_0_50px_rgba(124,58,237,0.15)] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent pointer-events-none" />
            <Sparkles className="w-12 h-12 text-pink mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-6">The Science Behind the Sync</h2>
            <p className="text-lg text-textSecondary leading-relaxed mb-8">
              When you purchase a dream from our marketplace, the Real Dream APK downloads a highly specialized package containing binaural beats, specific narrative cues, and haptic feedback profiles. These elements work in perfect harmony during your deepest sleep phases to induce a lucid state, seamlessly injecting the purchased narrative directly into your subconscious.
            </p>
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-accent font-medium">
              <Activity className="w-5 h-5" /> Backed by Neurological Research
            </div>
          </div>
        </section>

        {/* Subconscious FAQ Section */}
        <section className="py-24 relative">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-12 text-center">Frequently Asked <span className="text-gradient">Questions</span></h2>
            <div className="space-y-6">
              <FAQItem 
                question="Is Real Dream safe?" 
                answer="Absolutely. Our technology uses non-invasive sound frequencies and narrative structures. It never interferes with your brain's natural ability to wake up or process emotions." 
              />
              <FAQItem 
                question="How do I sync my purchases?" 
                answer="Once you purchase a dream on this website, simply open the Real Dream APK on your Android device. Navigate to 'My Dreams' and tap the sync button. Your new experiences will appear instantly." 
              />
              <FAQItem 
                question="Do I need any special hardware?" 
                answer="No. Any standard headphones and your Android smartphone are all you need to begin your journey into the subconscious." 
              />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-24 relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-textSecondary">From our marketplace directly into your mind.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-1/2 left-10 right-10 h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2 -z-10" />
            
            <StepCard number="01" title="Browse the Market" desc="Explore our vast library of premium subconscious experiences right here on the web." />
            <StepCard number="02" title="Secure Purchase" desc="Log in with your APK credentials and securely acquire your desired dream." />
            <StepCard number="03" title="Sync & Sleep" desc="Open the Real Dream mobile app. Your purchase instantly syncs. Just hit play and fall asleep." />
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<Brain className="w-8 h-8 text-accent" />}
              title="Lucid Control"
              description="Gain unprecedented control over your subconscious narratives with our premium dream packs."
            />
            <FeatureCard 
              icon={<Zap className="w-8 h-8 text-yellow-400" />}
              title="Instant Sync"
              description="Any dream purchased here instantly syncs with your mobile APK for immediate access tonight."
            />
            <FeatureCard 
              icon={<Moon className="w-8 h-8 text-blue-400" />}
              title="Deep Sleep"
              description="Optimized frequencies ensure you reach REM sleep faster to begin your new adventure."
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
  return (
    <div className="glass p-8 rounded-2xl border border-white/5 hover:border-accent/30 transition-all">
      <h4 className="text-xl font-bold mb-3">{question}</h4>
      <p className="text-textSecondary leading-relaxed">{answer}</p>
    </div>
  );
}

function InfoCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="glass p-6 rounded-2xl hover:bg-white/10 transition-colors shadow-[0_0_15px_rgba(167,139,250,0.1)] hover:shadow-[0_0_25px_rgba(236,72,153,0.3)] border border-white/10">
      <div className="mb-4">{icon}</div>
      <h4 className="font-bold mb-2">{title}</h4>
      <p className="text-sm text-textSecondary">{desc}</p>
    </div>
  );
}

function StepCard({ number, title, desc }: { number: string, title: string, desc: string }) {
  return (
    <motion.div whileHover={{ y: -5 }} className="glass-dark p-8 rounded-3xl text-center relative border border-accent/20 shadow-[0_0_20px_rgba(124,58,237,0.1)] hover:shadow-[0_0_40px_rgba(124,58,237,0.4)] transition-shadow">
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-accent flex items-center justify-center font-bold text-xl shadow-[0_0_20px_rgba(124,58,237,0.5)]">
        {number}
      </div>
      <h3 className="text-2xl font-bold mb-4 mt-4">{title}</h3>
      <p className="text-textSecondary leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="glass-dark p-8 rounded-3xl border border-white/10 shadow-[0_0_20px_rgba(167,139,250,0.1)] hover:shadow-[0_0_40px_rgba(236,72,153,0.4)] transition-shadow"
    >
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 shadow-inner">
        {icon}
      </div>
      <h3 className="text-2xl font-bold mb-4">{title}</h3>
      <p className="text-textSecondary leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}
