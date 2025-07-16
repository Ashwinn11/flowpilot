import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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
  return (
    <section id="faq" className="px-4 sm:px-6 lg:px-8 py-20 bg-white/50 dark:bg-slate-800/50">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Everything you need to know about FlowPilot
          </p>
        </div>
        
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border-b border-slate-200/50 dark:border-slate-700/50">
              <AccordionTrigger className="text-left font-semibold text-slate-900 dark:text-slate-100 hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}