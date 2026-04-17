import { motion } from 'framer-motion';

const Hero = () => {
  return (
    <section className="pt-32 pb-20 px-6 max-w-5xl mx-auto text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center justify-center gap-6"
      >
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-bloom-border bg-bloom-charcoal text-sm text-bloom-gray">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-6 h-6 rounded-full bg-gray-600 border border-black flex items-center justify-center text-[10px] text-white overflow-hidden">
                U
              </div>
            ))}
          </div>
          Trusted by over 2k+ Members
        </div>

        <h1 className="text-5xl md:text-[68px] leading-tight font-heading font-semibold text-white max-w-4xl tracking-tight">
          Your AI Career Assistant, Built for Clarity and Growth
        </h1>
        
        <p className="text-xl text-bloom-gray max-w-2xl mt-2 mb-4">
          Get personalized guidance, skill-building roadmaps, and real-time support — all in one intuitive app.
        </p>

        <div className="flex items-center gap-4">
          <button className="bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-transform hover:scale-105 active:scale-95">
            Download the App
          </button>
          <button className="px-6 py-3 rounded-xl font-semibold text-white border border-bloom-border bg-bloom-charcoal hover:bg-bloom-border/30 transition-colors">
            Explore Features
          </button>
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;
