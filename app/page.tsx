import { Hero } from "@/components/landing/hero";
import { Workflow } from "@/components/landing/workflow";
import { Features } from "@/components/landing/features";
import { Testimonials } from "@/components/landing/testimonials";
import { FAQ } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <Header />
      <Hero />
      <Workflow />
      <Features />
      <Testimonials />
      <FAQ />
      <Footer />
    </div>
  );
}