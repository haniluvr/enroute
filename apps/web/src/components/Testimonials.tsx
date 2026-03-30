import { motion } from 'framer-motion';

const Testimonials = () => {
  const reviews = [
    {
      text: "Bloom gave me direction when I had none. I wasn't sure what to do with my Communications degree, but the roadmap helped me see clear paths forward — and the AI voice assistant actually made the process fun.",
      name: "Jessica M.",
      role: "Recent University Graduate"
    },
    {
      text: "I switched from civil engineering into tech, and Bloom made it feel less overwhelming. The personalized roadmap was spot on, and being able to scan my CV for missing skills was a game-changer.",
      name: "Adewale O.",
      role: "Front-End Developer (Career Switcher)"
    },
    {
      text: "I love that I can talk to Bloom anytime. It feels like I have a coach on standby. The voice feature and downloadable resources have helped me build confidence for my next move.",
      name: "Nina D.",
      role: "Recent University Graduate"
    },
    {
      text: "Other career tools felt generic. Bloom actually feels like it knows me. The way it breaks down growth into clear steps makes it easier to stay focused — and the dark mode UI is super clean.",
      name: "Rahul S.",
      role: "Data Analyst"
    },
    {
      text: "I tested Bloom for a few of my interns and entry-level hires — and honestly, it's the kind of support system I wish I had when I started. It makes mentorship scalable in a really smart way.",
      name: "Samir T.",
      role: "HR Professional"
    },
    {
      text: "Bloom helped me identify gaps in my portfolio and suggested practical steps to transition into a UX role. The voice assistant felt like a real coach!",
      name: "Sarah M.",
      role: "Product Designer"
    }
  ];

  return (
    <section className="px-6 py-24 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <p className="text-sm font-semibold tracking-wider text-bloom-gray uppercase mb-4">Seeing is Believing</p>
        <h2 className="text-4xl md:text-5xl font-heading font-semibold max-w-3xl mx-auto mb-8">
          Real stories from people using Bloom to grow with clarity and direction
        </h2>
      </div>

      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {reviews.map((review, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: (idx % 3) * 0.1, duration: 0.4 }}
            className="bg-bloom-card border border-bloom-border rounded-3xl p-8 break-inside-avoid hover:border-white/20 transition-all"
          >
            <p className="text-lg text-bloom-gray font-medium leading-relaxed mb-6">
              "{review.text}"
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-sm font-bold">
                {review.name.charAt(0)}
              </div>
              <div>
                <h4 className="text-white font-semibold font-heading">{review.name}</h4>
                <p className="text-sm text-bloom-gray">{review.role}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
