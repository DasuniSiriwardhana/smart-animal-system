"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";
import { Check, AlertCircle, ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

const PLAN_DETAILS = {
  standard: {
    id: "standard",
    name: "Standard Plan",
    price: 1500,
    priceYearly: 14400,
    features: [
      "Up to 10 pets",
      "AI Insights & predictions",
      "Advanced analytics",
      "10GB document storage",
      "Priority support",
      "Vet chat consultations",
    ],
  },
  premium: {
    id: "premium",
    name: "Premium Plan",
    price: 3500,
    priceYearly: 33600,
    features: [
      "Unlimited pets",
      "Everything in Standard",
      "Video vet consultations",
      "50GB document storage",
      "24/7 phone support",
      "Multiple users per account",
      "API access",
    ],
  },
};

export const dynamic = 'force-dynamic';

function UpgradePageContent() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [selectedPlan, setSelectedPlan] = useState<"standard" | "premium">(
    (searchParams.get("plan") as "standard" | "premium") || "standard"
  );
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    (searchParams.get("cycle") as "monthly" | "yearly") || "monthly"
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [error, setError] = useState("");

  const plan = PLAN_DETAILS[selectedPlan];
  const amount = billingCycle === "monthly" ? plan.price : plan.priceYearly;

  useEffect(() => {
    if (user?.plan === selectedPlan) {
      router.push("/dashboard");
    }
  }, [user, selectedPlan, router]);

  const handleSubscribe = async () => {
    if (!cardName || !cardNumber || !expiryDate || !cvv) {
      setError("Please fill in all card details");
      return;
    }

    setIsProcessing(true);
    setError("");
    
    try {
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = billingCycle === "yearly" 
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      let subscriptionId = null;
      
      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (existingSub) {
        const { data, error } = await supabase
          .from("subscriptions")
          .update({
            plan_type: selectedPlan,
            status: "active",
            start_date: startDate,
            end_date: endDate,
            amount: amount,
          })
          .eq("user_id", user?.id)
          .select();
        
        if (error) throw error;
        if (data && data[0]) subscriptionId = data[0].id;
      } else {
        const { data, error } = await supabase
          .from("subscriptions")
          .insert({
            user_id: user?.id,
            plan_type: selectedPlan,
            status: "active",
            start_date: startDate,
            end_date: endDate,
            amount: amount,
            payment_method: "card",
          })
          .select();
        
        if (error) throw error;
        if (data && data[0]) subscriptionId = data[0].id;
      }
      
      await supabase
        .from("invoices")
        .insert({
          user_id: user?.id,
          amount: amount,
          status: "paid",
          invoice_date: startDate,
          plan_type: selectedPlan,
          billing_interval: billingCycle === "monthly" ? "month" : "year"
        });

      // ✅ ONLY ADDITION: Insert payment record for revenue analytics
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      
      const { error: paymentError } = await supabase
        .from('subscription_payments')
        .insert({
          user_id: user?.id,
          subscription_id: subscriptionId,
          plan_type: selectedPlan,
          amount: amount,
          currency: 'LKR',
          billing_interval: billingCycle === "monthly" ? "month" : "year",
          payment_date: startDate,
          payment_method: 'card',
          status: 'completed',
          transaction_id: transactionId
        });

      if (paymentError) {
        console.error('Error saving payment record:', paymentError);
        // Don't throw - subscription still works
      }
      
      await supabase
        .from('profiles')
        .update({ plan: selectedPlan })
        .eq('id', user?.id);

      await refreshUser();
      router.push("/dashboard?upgrade=success");
      
    } catch (err) {
      console.error("Upgrade error:", err);
      setError("Payment failed. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <Link href="/pricing" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Pricing
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Complete Your Upgrade</h1>
          <p className="text-muted-foreground">Choose a plan and enter your payment details</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Select Your Plan</CardTitle>
                <CardDescription>Choose the plan that fits your needs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as "standard" | "premium")}>
                  <div className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-all ${selectedPlan === "standard" ? "border-primary bg-primary/5" : "hover:border-primary/50"}`}>
                    <RadioGroupItem value="standard" id="standard" />
                    <Label htmlFor="standard" className="flex-1 cursor-pointer">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-lg">Standard Plan</div>
                          <div className="text-2xl font-bold mt-1">
                            LKR {plan.price.toLocaleString()}
                            <span className="text-sm font-normal text-muted-foreground">/month</span>
                          </div>
                        </div>
                      </div>
                    </Label>
                  </div>
                  
                  <div className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-all ${selectedPlan === "premium" ? "border-primary bg-primary/5" : "hover:border-primary/50"}`}>
                    <RadioGroupItem value="premium" id="premium" />
                    <Label htmlFor="premium" className="flex-1 cursor-pointer">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-lg flex items-center gap-2">
                            Premium Plan
                            <Badge variant="default" className="bg-gradient-to-r from-primary to-accent">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Best Value
                            </Badge>
                          </div>
                          <div className="text-2xl font-bold mt-1">
                            LKR {PLAN_DETAILS.premium.price.toLocaleString()}
                            <span className="text-sm font-normal text-muted-foreground">/month</span>
                          </div>
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                <div className="flex gap-4 mt-4">
                  <Button
                    variant={billingCycle === "monthly" ? "default" : "outline"}
                    onClick={() => setBillingCycle("monthly")}
                    className="flex-1"
                  >
                    Monthly Billing
                  </Button>
                  <Button
                    variant={billingCycle === "yearly" ? "default" : "outline"}
                    onClick={() => setBillingCycle("yearly")}
                    className="flex-1 gap-2"
                  >
                    Yearly Billing
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      Save 20%
                    </Badge>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>What&apos;s Included</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {PLAN_DETAILS[selectedPlan].features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 py-1">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
                <CardDescription>Secure payment processing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-primary/5 rounded-lg mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Selected Plan:</span>
                    <span className="font-semibold capitalize">{selectedPlan}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Billing Cycle:</span>
                    <span className="font-semibold capitalize">{billingCycle}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t mt-2">
                    <span className="font-bold">Total Amount:</span>
                    <span className="text-2xl font-bold text-primary">
                      LKR {amount.toLocaleString()}
                      {billingCycle === "yearly" && <span className="text-xs">/year</span>}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Cardholder Name</Label>
                  <Input 
                    placeholder="David Warner"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Card Number</Label>
                  <Input 
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Expiry Date</Label>
                    <Input 
                      placeholder="MM/YY"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CVV</Label>
                    <Input 
                      type="password"
                      placeholder="123"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                    />
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleSubscribe} 
                  disabled={isProcessing}
                  className="w-full"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Pay LKR ${amount.toLocaleString()}`
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <UpgradePageContent />
    </Suspense>
  );
}