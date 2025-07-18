"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState } from "react";

const faqs = [
  {
    question: "How does the 7-day free trial work?",
    answer: "You get full access to all FlowPilot features for 7 days. No credit card required to start. After the trial, you can choose to subscribe or your account will be paused."
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, you can cancel your subscription at any time. There are no cancellation fees or penalties. Your account will remain active until the end of your billing period."
  },
  {
    question: "How accurate is the AI task planning?",
    answer: "FlowPilot's AI learns from your patterns and preferences over time. Most users see significant improvement in planning accuracy within the first week of use."
  },
  {
    question: "Does it work offline?",
    answer: "FlowPilot is a PWA (Progressive Web App) that works offline for viewing and basic task management. AI features require an internet connection."
  },
  {
    question: "Is my data secure?",
    answer: "Yes, all data is encrypted at rest and in transit. We use industry-standard security practices and never share your personal information with third parties."
  },
  {
    question: "Will there be mobile apps?",
    answer: "FlowPilot is built as a PWA that works great on mobile devices. Native iOS and Android apps are coming soon for an even better mobile experience."
  }
];

export function FAQ() {
const [openItems, setOpenItems] = useState<string[]>([]);

  const handleValueChange = (value: string) => {
    setOpenItems(value ? [value] : []);
  };

  return (
    <section id="faq" className="px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 dark:from-slate-900 dark:via-purple-950/30 dark:to-blue-950/20 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 w-32 h-32 bg-purple-200/15 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-blue-200/15 rounded-full blur-2xl"></div>
      </div>

      <div className="max-w-3xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Everything you need to know about FlowPilot
          </p>
        </div>
        
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
          <Accordion type="single" collapsible className="w-full" value={openItems[0]} onValueChange={handleValueChange}>
            {faqs.map((faq, index) => {
              const itemId = `item-${index}`;
              const isOpen = openItems.includes(itemId);
              
              return (
                <AccordionItem 
                  key={index} 
                  value={itemId} 
                  className={`border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                    index === 0 ? 'first:rounded-t-xl' : ''
                  } ${index === faqs.length - 1 ? 'last:rounded-b-xl' : ''}`}
                >
                  <AccordionTrigger className="text-left font-semibold text-gray-900 dark:text-white hover:no-underline px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors [&>svg]:hidden">
                    <span className="text-left">{faq.question}</span>
                    <div className="flex-shrink-0 ml-4 w-4 h-4 relative">
                      {/* Animated + to × symbol */}
                      <div className={`absolute inset-0 transition-all duration-300 ease-in-out ${
                        isOpen ? 'rotate-45' : 'rotate-0'
                      }`}>
                        {/* Vertical line (always visible) */}
                        <div className="absolute left-1/2 top-0 w-0.5 h-4 bg-purple-600 transform -translate-x-1/2"></div>
                        {/* Horizontal line (rotates to become ×) */}
                        <div className="absolute left-0 top-1/2 w-4 h-0.5 bg-purple-600 transform -translate-y-1/2"></div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 dark:text-gray-300 leading-relaxed px-6 pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </div>
    </section>
  );
}