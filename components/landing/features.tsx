import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Mic, MessageSquare, BarChart3, Bell, Users } from "lucide-react";

const features = [
  {
    icon: CheckCircle,
    title: "Daily Focus Planner",
    description: "Organize your top 3 priorities and visualize your day with an intelligent timeline view."
  },
  {
    icon: Mic,
    title: "Voice Task Entry",
    description: "Speak naturally to add tasks. AI understands context and automatically schedules them."
  },
  {
    icon: MessageSquare,
    title: "AI Assistant",
    description: "Get instant help with scheduling, task suggestions, and productivity insights."
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    description: "Monitor your productivity patterns with detailed analytics and completion rates."
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    description: "Receive contextual notifications at the right time to keep you on track."
  },
  {
    icon: Users,
    title: "Team Sync",
    description: "Share progress and coordinate with teammates for better collaboration."
  }
];

export function Features() {
  return (
    <section id="features" className="px-4 sm:px-6 lg:px-8 py-20 bg-white/50 dark:bg-slate-800/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Everything You Need to Stay Focused
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Powerful features designed to help you plan, execute, and track your most important work.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <feature.icon className="w-12 h-12 text-blue-600 mb-4" />
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}