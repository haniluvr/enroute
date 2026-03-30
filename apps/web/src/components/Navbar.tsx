const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-xl bg-black/40 border-b border-bloom-border px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-xl font-heading font-bold text-white tracking-tight cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center p-1.5 border border-white/10">
            <div className="w-full h-full rounded-full bg-gradient-to-tr from-blue-500 to-purple-500" />
          </div>
          Bloom
        </div>
        
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center bg-white/5 border border-white/5 rounded-full p-1 self-center">
          <a href="#" className="px-5 py-1.5 rounded-full bg-white/10 text-white text-sm font-semibold transition-all">Home</a>
          <a href="#" className="px-5 py-1.5 rounded-full hover:bg-white/5 text-bloom-gray hover:text-white text-sm font-medium transition-all">About us</a>
          <a href="#" className="px-5 py-1.5 rounded-full hover:bg-white/5 text-bloom-gray hover:text-white text-sm font-medium transition-all">Pricing</a>
        </div>
        
        <button className="bg-white text-black px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-100 transition-all hover:scale-[1.02] active:scale-[0.98]">
          Try for free
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
