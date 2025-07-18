import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Quote, Sparkles, Heart, Zap } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Product Manager",
    company: "TechCorp",
    avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400",
    content: "FlowPilot transformed how I manage my day. The AI scheduling is incredibly intuitive and the voice input saves me so much time.",
    rating: 5,
    emotion: "Life-changing! ✨"
  },
  {
    name: "Marcus Rodriguez",
    role: "Designer",
    company: "Creative Studio",
    avatar: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400",
    content: "The best productivity app I've ever used. Finally, something that understands how I actually work and adapts to my schedule.",
    rating: 5,
    emotion: "Pure magic! 🚀"
  },
  {
    name: "Emily Johnson",
    role: "Entrepreneur",
    company: "Startup Founder",
    avatar: "https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=400",
    content: "My productivity has increased by 40% since using FlowPilot. The AI assistant feels like having a personal productivity coach.",
    rating: 5,
    emotion: "Game changer! 💪"
  }
];

export function Testimonials() {
  return (
    <section id="testimonials" className="px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 dark:from-slate-900 dark:via-purple-950/30 dark:to-blue-950/20 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 w-32 h-32 bg-purple-200/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-blue-200/15 rounded-full blur-2xl animate-bounce"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-purple-200/10 to-blue-200/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Loved by Productive People
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6">
            See how FlowPilot is helping thousands of professionals master their daily workflow.
          </p>
          <p className="text-xl font-caveat text-purple-600 dark:text-purple-400">
            &quot;Real people, real results! ✨&quot;
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="transform transition-all duration-500 hover:scale-105"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <Card className="border-2 border-purple-200 dark:border-purple-700 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
                {/* Animated background elements */}
                <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity">
                  <div className="animate-spin">
                    <Sparkles className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
                
                <div className="absolute bottom-4 left-4 opacity-20 group-hover:opacity-40 transition-opacity">
                  <div className="animate-pulse">
                    <Heart className="w-6 h-6 text-red-500" />
                  </div>
                </div>

                <CardContent className="p-6 relative z-10">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <div
                        key={i}
                        className="transform transition-all duration-300"
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      </div>
                    ))}
                  </div>
                  
                  <div className="relative mb-6">
                    <div className="animate-bounce">
                      <Quote className="w-8 h-8 text-purple-300 dark:text-purple-600 absolute -top-2 -left-2" />
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed pl-6">
                      {testimonial.content}
                    </p>
                  </div>
                  
                  <div className="flex items-center mb-4">
                    <div className="transform transition-transform duration-200 hover:scale-110">
                      <Avatar className="w-12 h-12 mr-4 border-2 border-purple-200 dark:border-purple-700 shadow-lg">
                        <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                        <AvatarFallback className="bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 font-semibold">
                          {testimonial.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{testimonial.role}, {testimonial.company}</p>
                    </div>
                  </div>

                  {/* Handwritten emotion note */}
                  <div className="absolute bottom-4 right-4">
                    <p className="text-sm font-caveat text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-700">
                      {testimonial.emotion}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}