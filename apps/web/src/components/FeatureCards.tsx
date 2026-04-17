import { motion } from 'framer-motion';
import { FileText, Map, Mic } from 'lucide-react';

const FeatureCards = () => {
  const cards = [
    {
      title: "Select Career Interests",
      description: "Pick the roles, fields, and topics you're curious about — Bloom uses this to create a personalized experience",
      icon: <Map className="w-6 h-6 text-blue-400" />
    },
    {
      title: "Explore your roadmap",
      description: "Bloom creates a personalized roadmap with skills, tasks, and resources to guide your growth",
      icon: <Map className="w-6 h-6 text-green-400" />
    },
    {
      title: "Upload your CV",
      description: "Get instant insights into your strengths, skill gaps, and growth areas — all from a quick CV scan",
      icon: <FileText className="w-6 h-6 text-purple-400" />
    },
    {
      title: "Talk, track and grow",
      description: "Talk to your AI assistant, log thoughts, and monitor progress track ideas, and stay on top of your progress",
      icon: <Mic className="w-6 h-6 text-orange-400" />
    }
  ];

  return (
    <section className="px-6 py-20 max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-heading font-semibold mb-6 max-w-4xl mx-auto leading-tight">
          Whether you're planning your next move, switching paths, or just getting started, Bloom gives you clarity, tools, and support, to move forward with confidence.
        </h2>
        <p className="text-xl text-bloom-gray font-medium">Start smart, grow faster</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1, duration: 0.5 }}
            className="bg-bloom-card border border-bloom-border rounded-3xl p-8 flex flex-col gap-4 hover:border-white/20 transition-colors"
          >
            <div className="bg-bloom-charcoal border border-bloom-border w-12 h-12 rounded-2xl flex items-center justify-center">
              {card.icon}
            </div>
            <h3 className="text-2xl font-heading font-semibold text-white mt-4">{card.title}</h3>
            <p className="text-bloom-gray leading-relaxed text-lg">{card.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default FeatureCards;
