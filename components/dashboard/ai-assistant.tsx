"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Bot, User, Clock, CheckCircle, X } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  actions?: Array<{
    label: string;
    action: string;
  }>;
}

const mockMessages: Message[] = [
  {
    id: "1",
    content: "Hello! I'm your AI productivity assistant. How can I help you organize your day?",
    sender: "ai",
    timestamp: new Date()
  }
];

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: generateAIResponse(inputValue),
        sender: "ai",
        timestamp: new Date(),
        actions: inputValue.toLowerCase().includes("free") ? [
          { label: "Schedule Focus Block", action: "schedule" },
          { label: "Suggest Tasks", action: "suggest" }
        ] : undefined
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const generateAIResponse = (input: string) => {
    if (input.toLowerCase().includes("free")) {
      return "I see you have a 1-hour gap at 2PM today. I recommend scheduling a focus block for deep work. Would you like me to suggest some tasks that would fit well in this time slot?";
    }
    if (input.toLowerCase().includes("productive")) {
      return "Based on your patterns, you're most productive between 9-11 AM. Consider scheduling your most important tasks during this time. Your current streak is 12 days - keep it up!";
    }
    return "I understand you're asking about your schedule. Let me help you optimize your day for maximum productivity.";
  };

  const handleAction = (action: string) => {
    // TODO: Implement action handling
    if (process.env.NODE_ENV !== 'production') {
      console.log("Action:", action);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 shadow-lg z-50"
      >
        <MessageSquare className="w-6 h-6 text-white" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] z-50">
      <Card className="h-full shadow-2xl border-0 bg-white/95 backdrop-blur-sm dark:bg-slate-900/95">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-lg">
              <Bot className="w-5 h-5 mr-2 text-blue-600" />
              AI Assistant
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex flex-col h-full pb-4">
          <ScrollArea className="flex-1 mb-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.sender === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    }`}
                  >
                    <div className="flex items-center mb-1">
                      {message.sender === "user" ? (
                        <User className="w-4 h-4 mr-2" />
                      ) : (
                        <Bot className="w-4 h-4 mr-2" />
                      )}
                      <span className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    
                    {message.actions && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {message.actions.map((action, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction(action.action)}
                            className="text-xs"
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
                    <div className="flex items-center space-x-1">
                      <Bot className="w-4 h-4 mr-2" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: "0.1s"}}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: "0.2s"}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="flex space-x-2">
            <Input
              placeholder="Ask about your schedule..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              size="icon"
              className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}