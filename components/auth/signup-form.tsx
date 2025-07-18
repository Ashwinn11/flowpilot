"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { GoogleIcon, MicrosoftIcon } from "@/components/ui/icons";
import { 
  Mail, 
  Eye, 
  EyeOff, 
  User, 
  Clock, 
  Globe, 
  Calendar,
  ArrowRight,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AuthValidator, AuthValidationError } from "@/lib/auth-validation";
import Link from "next/link";

interface SignupData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  timezone: string;
  workHours: {
    start: string;
    end: string;
    days: number[];
  };
  acceptTerms: boolean;
  acceptMarketing: boolean;
}

export function SignupForm() {
  const { user, signInWithGoogle, signInWithMicrosoft, signUpWithEmail } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<AuthValidationError[]>([]);
  const [passwordStrength, setPasswordStrength] = useState<{score: number; feedback: string[]; isStrong: boolean} | null>(null);

  const [formData, setFormData] = useState<SignupData>({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    timezone: "UTC",
    workHours: {
      start: "09:00",
      end: "17:00",
      days: [1, 2, 3, 4, 5] // Mon-Fri
    },
    acceptTerms: false,
    acceptMarketing: false
  });

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Auto-detect timezone
  useEffect(() => {
    try {
      const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setFormData(prev => ({ ...prev, timezone: detectedTimezone }));
    } catch (error) {
      console.log('Could not detect timezone, using UTC');
    }
  }, []);

  const validateStep = (step: number): boolean => {
    setValidationErrors([]);
    
    switch (step) {
      case 1: // Account details
        if (!formData.email || !formData.password || !formData.confirmPassword || !formData.name) {
          setValidationErrors([{ field: 'general', message: 'Please fill in all required fields' }]);
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setValidationErrors([{ field: 'confirmPassword', message: 'Passwords do not match' }]);
          return false;
        }
        if (formData.password.length < 8) {
          setValidationErrors([{ field: 'password', message: 'Password must be at least 8 characters long' }]);
          return false;
        }
        break;
      
      case 2: // Work preferences
        if (!formData.workHours.start || !formData.workHours.end) {
          setValidationErrors([{ field: 'workHours', message: 'Please set your work hours' }]);
          return false;
        }
        if (formData.workHours.days.length === 0) {
          setValidationErrors([{ field: 'workDays', message: 'Please select at least one work day' }]);
          return false;
        }
        break;
      
      case 3: // Terms
        if (!formData.acceptTerms) {
          setValidationErrors([{ field: 'terms', message: 'You must accept the terms and conditions' }]);
          return false;
        }
        break;
    }
    
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) return;
    
    setLoading(true);
    
    try {
      await signUpWithEmail(formData.email, formData.password);
      toast.success('Your account was created! Please check your email to verify and get started.');
      
      // In a real app, you'd also create the user profile here
      // For now, we'll redirect to dashboard where the profile will be created
      router.push('/dashboard');
    } catch (error: any) {
      toast.error('Sorry, we couldn\'t create your account. Please try again.');
      console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignup = async (provider: 'google' | 'microsoft') => {
    try {
      setLoading(true);
      let result;
      if (provider === 'google') {
        result = await signInWithGoogle();
      } else {
        result = await signInWithMicrosoft();
      }
      if (result && !result.success) {
        toast.error(result.error || `Oops! Signing up with ${provider} didn't work. Please try again.`);
        return;
      }
    } catch (error) {
      toast.error(`Oops! Signing up with ${provider} didn't work. Please try again.`);
      console.error('OAuth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (!passwordStrength) return 'bg-gray-200';
    if (passwordStrength.score >= 3) return 'bg-green-500';
    if (passwordStrength.score >= 2) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getPasswordStrengthText = () => {
    if (!passwordStrength) return '';
    if (passwordStrength.score >= 3) return 'Strong';
    if (passwordStrength.score >= 2) return 'Medium';
    return 'Weak';
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-6">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step <= currentStep 
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
            }`}>
              {step < currentStep ? <CheckCircle className="w-4 h-4" /> : step}
            </div>
            {step < 3 && (
              <div className={`w-12 h-0.5 mx-2 ${
                step < currentStep ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step labels */}
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {currentStep === 1 && 'Account Details'}
          {currentStep === 2 && 'Work Preferences'}
          {currentStep === 3 && 'Terms & Conditions'}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {currentStep === 1 && 'Create your account with basic information'}
          {currentStep === 2 && 'Set up your work schedule for better productivity'}
          {currentStep === 3 && 'Review and accept our terms'}
        </p>
      </div>

      {/* OAuth buttons - only show on first step */}
      {currentStep === 1 && (
        <>
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full h-12 bg-white/80 backdrop-blur-sm hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border-2 border-gray-200 dark:border-gray-700"
              onClick={() => handleOAuthSignup("google")}
              disabled={loading}
            >
              <GoogleIcon className="w-5 h-5 mr-3" />
              Continue with Google
            </Button>
            
            <Button
              variant="outline"
              className="w-full h-12 bg-white/80 backdrop-blur-sm hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border-2 border-gray-200 dark:border-gray-700"
              onClick={() => handleOAuthSignup("microsoft")}
              disabled={loading}
            >
              <MicrosoftIcon className="w-5 h-5 mr-3" />
              Continue with Microsoft
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-2 text-gray-500 dark:text-gray-400">Or continue with email</span>
            </div>
          </div>
        </>
      )}

      {/* Form steps */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Account Details */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">Full Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-10 h-12 bg-white/80 backdrop-blur-sm border-2 border-gray-200 dark:bg-slate-800/80 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400"
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10 h-12 bg-white/80 backdrop-blur-sm border-2 border-gray-200 dark:bg-slate-800/80 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pr-10 h-12 bg-white/80 backdrop-blur-sm border-2 border-gray-200 dark:bg-slate-800/80 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400"
                  autoComplete="new-password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {formData.password && (
                <div className="space-y-2">
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full ${
                          level <= (passwordStrength?.score || 0) ? getPasswordStrengthColor() : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Password strength: {getPasswordStrengthText()}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300">Confirm Password *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="pr-10 h-12 bg-white/80 backdrop-blur-sm border-2 border-gray-200 dark:bg-slate-800/80 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400"
                  autoComplete="new-password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Work Preferences */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="timezone" className="text-gray-700 dark:text-gray-300">Timezone</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Select
                  value={formData.timezone}
                  onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                >
                  <SelectTrigger className="pl-10 h-12 bg-white/80 backdrop-blur-sm border-2 border-gray-200 dark:bg-slate-800/80 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400">
                    <SelectValue placeholder="Select your timezone" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-gray-200 dark:border-slate-700">
                    <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    <SelectItem value="Europe/London">London (GMT/BST)</SelectItem>
                    <SelectItem value="Europe/Paris">Paris (CET/CEST)</SelectItem>
                    <SelectItem value="Europe/Berlin">Berlin (CET/CEST)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                    <SelectItem value="Asia/Shanghai">Shanghai (CST)</SelectItem>
                    <SelectItem value="Australia/Sydney">Sydney (AEDT/AEST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-gray-700 dark:text-gray-300">Work Hours</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime" className="text-sm text-gray-600 dark:text-gray-400">Start Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.workHours.start}
                      onChange={(e) => setFormData({
                        ...formData,
                        workHours: { ...formData.workHours, start: e.target.value }
                      })}
                      className="pl-10 h-12 bg-white/80 backdrop-blur-sm border-2 border-gray-200 dark:bg-slate-800/80 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime" className="text-sm text-gray-600 dark:text-gray-400">End Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.workHours.end}
                      onChange={(e) => setFormData({
                        ...formData,
                        workHours: { ...formData.workHours, end: e.target.value }
                      })}
                      className="pl-10 h-12 bg-white/80 backdrop-blur-sm border-2 border-gray-200 dark:bg-slate-800/80 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-gray-700 dark:text-gray-300">Work Days</Label>
              <div className="flex flex-wrap gap-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
                  <Button
                    key={day}
                    type="button"
                    variant={formData.workHours.days.includes(index + 1) ? "gradient" : "outline"}
                    size="sm"
                    onClick={() => {
                      const days = formData.workHours.days.includes(index + 1)
                        ? formData.workHours.days.filter(d => d !== index + 1)
                        : [...formData.workHours.days, index + 1].sort();
                      setFormData({
                        ...formData,
                        workHours: { ...formData.workHours, days }
                      });
                    }}
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Terms & Conditions */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms"
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) => setFormData({ ...formData, acceptTerms: checked as boolean })}
                  className="mt-1"
                />
                <div className="space-y-1">
                  <Label htmlFor="terms" className="text-sm text-gray-700 dark:text-gray-300">
                    I accept the Terms of Service and Privacy Policy *
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    By creating an account, you agree to our terms and acknowledge our privacy practices.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="marketing"
                  checked={formData.acceptMarketing}
                  onCheckedChange={(checked) => setFormData({ ...formData, acceptMarketing: checked as boolean })}
                  className="mt-1"
                />
                <div className="space-y-1">
                  <Label htmlFor="marketing" className="text-sm text-gray-700 dark:text-gray-300">
                    Send me productivity tips and updates
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Get helpful tips, new features, and productivity insights. You can unsubscribe anytime.
                  </p>
                </div>
              </div>
            </div>

            <Card className="border-purple-200 bg-purple-50/80 backdrop-blur-sm dark:bg-purple-900/20 dark:border-purple-800">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-purple-900 dark:text-purple-100">Free Trial Included</h4>
                    <p className="text-sm text-purple-800 dark:text-purple-200 mt-1">
                      7-day free trial • No credit card required • Cancel anytime
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <div className="space-y-2">
            {validationErrors.map((error, index) => (
              <div key={index} className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between pt-4">
          {currentStep > 1 ? (
            <Button type="button" variant="outline" onClick={prevStep}>
              Back
            </Button>
          ) : (
            <div />
          )}
          
          {currentStep < 3 ? (
            <Button type="button" variant="gradient" onClick={nextStep}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button type="submit" variant="gradient" disabled={loading} className="w-full">
              {loading ? "Creating Account..." : "Create Account & Start Trial"}
            </Button>
          )}
        </div>
      </form>

      {/* Login link */}
      <div className="text-center text-sm">
        <span className="text-gray-600 dark:text-gray-400">Already have an account? </span>
        <Link href="/auth" className="text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300 font-medium transition-colors">
          Sign in
        </Link>
      </div>
    </div>
  );
} 