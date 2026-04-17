import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "What exactly does Bloom help me with?",
      answer: "Bloom is your AI-powered career assistant. It helps you explore career paths, generate personalized roadmaps, identify skill gaps through CV analysis, and get real-time advice through voice interactions. It's designed to support you whether you're starting, switching, or growing in your career."
    },
    {
      question: "Is Bloom really free to use?",
      answer: "Bloom offers full access to personalized career planning, guidance, and resources so anyone, anywhere, can start building a better future without financial friction."
    },
    {
      question: "How does the AI voice assistant work?",
      answer: "With Bloom's real-time AI call feature, you can speak naturally and get tailored advice, clarity, and encouragement just like chatting with a personal coach who knows your path."
    },
    {
      question: "Can I change my career interests or AI mentor later?",
      answer: "Yes, you can update your career interests and goals anytime, and your AI mentor will seamlessly adapt to provide the most relevant guidance for your new path."
    },
    {
      question: "Is my personal information and résumé data safe?",
      answer: "Absolutely. We prioritize your privacy and security. Your CV data and personal information are encrypted, securely stored, and only used to provide personalized career insights."
    }
  ];

  return (
    <section className="px-6 py-24 max-w-4xl mx-auto">
      <div className="text-center mb-16">
        <p className="text-sm font-semibold tracking-wider text-bloom-gray uppercase mb-4">Seeing is Believing</p>
        <h2 className="text-3xl md:text-5xl font-heading font-semibold">
          Still curious? Here are quick answers to help you get started with Bloom easily
        </h2>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <div 
            key={idx} 
            className="border border-bloom-border rounded-2xl bg-bloom-card overflow-hidden hover:border-white/20 transition-colors"
          >
            <button 
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full flex items-center justify-between p-6 text-left"
            >
              <h3 className="text-lg md:text-xl font-heading font-semibold text-white">
                {faq.question}
              </h3>
              <div className="text-bloom-gray ml-4 flex-shrink-0">
                {openIndex === idx ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
              </div>
            </button>
            <AnimatePresence>
              {openIndex === idx && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <div className="px-6 pb-6 text-bloom-gray text-lg leading-relaxed">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FAQ;
