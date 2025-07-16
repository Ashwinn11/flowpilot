import { UpgradePaywall } from "@/components/billing/upgrade-paywall";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function UpgradePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl space-y-6">
        <Link href="/dashboard" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to dashboard
        </Link>
        
        <UpgradePaywall />
      </div>
    </div>
  );
}