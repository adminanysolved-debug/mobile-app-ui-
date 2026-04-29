
export function Footer() {
  return (
    <footer className="w-full border-t border-white/10 bg-root/80 backdrop-blur-md py-6 px-6 mt-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-textSecondary">
        <div className="font-medium">
          &copy; 2026 RealDream. All rights reserved.
        </div>
        
        <div className="flex items-center gap-1 font-medium">
          Powered by{' '}
          <a 
            href="https://www.anysolved.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-accent hover:text-pink transition-colors font-bold"
          >
            Anysolved Ark
          </a>
        </div>
      </div>
    </footer>
  );
}
