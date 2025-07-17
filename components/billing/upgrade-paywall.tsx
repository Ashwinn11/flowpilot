"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Crown, Calendar, CreditCard } from "lucide-react";

export function UpgradePaywall() {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("monthly");

  const plans = {
    monthly: {
      price: "$12",
      period: "month",
      savings: null
    },
    annual: {
      price: "$99",
      period: "year",
      savings: "Save 17%"
    }
  };

  const features = [
    "Unlimited AI-powered task planning",
    "Voice input and natural language processing",
    "Advanced productivity analytics",
    "Smart scheduling and time blocking",
    "Priority support",
    "Calendar integrations",
    "Team collaboration features",
    "Custom productivity insights"
  ];

  const handleUpgrade = async () => {
    // TODO: Integrate with Stripe
    if (process.env.NODE_ENV !== 'production') {
      console.log("Upgrading to", selectedPlan);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border-0 shadow-2xl bg-white/90 backdrop-blur-sm dark:bg-slate-900/90">
      <CardHeader className="text-center pb-6">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-teal-600 rounded-full flex items-center justify-center mb-4">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold">
          Trial Over. Continue Your Productivity Streak.
        </CardTitle>
        <CardDescription className="text-lg">
          Upgrade to Pro to keep using FlowPilot&apos;s powerful features
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Plan Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card 
            className={`cursor-pointer transition-all duration-200 ${
              selectedPlan === "monthly" 
                ? "ring-2 ring-blue-600 bg-blue-50 dark:bg-blue-900/20" 
                : "hover:shadow-md"
            }`}
            onClick={() => setSelectedPlan("monthly")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">Monthly</h3>
                  <p className="text-sm text-muted-foreground">Pay monthly</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{plans.monthly.price}</div>
                  <div className="text-sm text-muted-foreground">per month</div>
                </div>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                <span className="text-sm">Billed monthly</span>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all duration-200 relative ${
              selectedPlan === "annual" 
                ? "ring-2 ring-blue-600 bg-blue-50 dark:bg-blue-900/20" 
                : "hover:shadow-md"
            }`}
            onClick={() => setSelectedPlan("annual")}
          >
            <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white">
              {plans.annual.savings}
            </Badge>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">Annual</h3>
                  <p className="text-sm text-muted-foreground">Pay yearly</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{plans.annual.price}</div>
                  <div className="text-sm text-muted-foreground">per year</div>
                </div>
              </div>
              <div className="flex items-center">
                <CreditCard className="w-4 h-4 mr-2 text-blue-600" />
                <span className="text-sm">$8.25 per month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div>
          <h3 className="font-semibold mb-4">Everything included:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={handleUpgrade}
            className="w-full h-12 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white text-lg font-semibold"
          >
            {selectedPlan === "monthly" ? "Subscribe Monthly" : "Go Annual - Save 17%"}
          </Button>
          
          <div className="text-center text-sm text-muted-foreground">
            Cancel anytime • 30-day money-back guarantee
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="text-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Join thousands of productive professionals using FlowPilot
          </p>
        </div>
      </CardContent>
    </Card>
  );
}