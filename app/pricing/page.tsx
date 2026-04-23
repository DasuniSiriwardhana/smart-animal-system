"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Crown, 
  Sparkles, 
  Shield, 
  CheckCircle, 
  XCircle,
  Loader2,
  CreditCard,
  FileText,
  TrendingUp,
  Eye
} from 'lucide-react';
import Link from 'next/link';

type Subscription = {
  id: string;
  plan_type: 'basic' | 'standard' | 'premium';
  status: string;
  start_date: string;
  end_date: string;
  amount: number;
};

type Invoice = {
  id: string;
  amount: number;
  status: string;
  invoice_date: string;
  plan_type: string;
};

type FeatureValue = string | boolean | number;

const featureCategories = [
  {
    id: 'pet-management',
    name: "Pet Management",
    features: [
      { id: 'max-pets', name: "Maximum Pets", basic: "2 pets", standard: "10 pets", premium: "Unlimited" },
      { id: 'pet-profiles', name: "Pet Profiles", basic: true, standard: true, premium: true },
      { id: 'pet-photos', name: "Pet Photos", basic: true, standard: true, premium: true },
      { id: 'breed-info', name: "Breed Information", basic: true, standard: true, premium: true },
      { id: 'weight-tracking', name: "Weight Tracking", basic: true, standard: true, premium: true },
    ]
  },
  {
    id: 'health-monitoring',
    name: "Health Monitoring",
    features: [
      { id: 'daily-logs', name: "Daily Health Logs", basic: true, standard: true, premium: true },
      { id: 'health-score', name: "Health Score from Logs", basic: true, standard: true, premium: true },
      { id: 'sensor-data', name: "Real-time Sensor Data", basic: false, standard: false, premium: true },
      { id: 'heart-rate', name: "Heart Rate Monitoring", basic: false, standard: false, premium: true },
      { id: 'temperature', name: "Temperature Monitoring", basic: false, standard: false, premium: true },
      { id: 'activity-tracking', name: "Activity Tracking", basic: false, standard: false, premium: true },
      { id: 'sleep-analysis', name: "Sleep Analysis", basic: true, standard: true, premium: true },
      { id: 'water-intake', name: "Water Intake Tracking", basic: true, standard: true, premium: true },
    ]
  },
  {
    id: 'ai-predictions',
    name: "AI & Predictions",
    features: [
      { id: 'ai-insights', name: "AI Health Insights", basic: "Basic", standard: "Advanced", premium: "Full" },
      { id: 'lstm-predictions', name: "LSTM Health Predictions", basic: false, standard: false, premium: true },
      { id: 'disease-detection', name: "AI Disease Detection", basic: false, standard: false, premium: true },
      { id: 'risk-alerts', name: "Health Risk Alerts", basic: false, standard: false, premium: true },
      { id: 'anomaly-detection', name: "Anomaly Detection", basic: "1 anomaly", standard: "3 anomalies", premium: "Unlimited" },
      { id: 'recommendations', name: "Health Recommendations", basic: "2/day", standard: "10/day", premium: "Unlimited" },
      { id: 'predictive-analytics', name: "Predictive Analytics", basic: false, standard: false, premium: true },
    ]
  },
  {
    id: 'feeding-nutrition',
    name: "Feeding & Nutrition",
    features: [
      { id: 'feeding-schedules', name: "Feeding Schedules", basic: "3 schedules", standard: "10 schedules", premium: "Unlimited" },
      { id: 'meal-reminders', name: "Meal Reminders", basic: true, standard: true, premium: true },
      { id: 'portion-tracking', name: "Portion Tracking", basic: true, standard: true, premium: true },
      { id: 'brand-tracking', name: "Food Brand Tracking", basic: true, standard: true, premium: true },
      { id: 'nutrition-analysis', name: "Nutrition Analysis", basic: false, standard: true, premium: true },
    ]
  },
  {
    id: 'medical-records',
    name: "Medical Records",
    features: [
      { id: 'vaccinations', name: "Vaccination Records", basic: true, standard: true, premium: true },
      { id: 'medications', name: "Medication Tracking", basic: true, standard: true, premium: true },
      { id: 'vet-appointments', name: "Vet Appointments", basic: true, standard: true, premium: true },
      { id: 'medical-docs', name: "Medical Documents", basic: "5 docs", standard: "100 docs", premium: "500 docs" },
      { id: 'prescriptions', name: "Prescription History", basic: true, standard: true, premium: true },
    ]
  },
  {
    id: 'support-communication',
    name: "Support & Communication",
    features: [
      { id: 'email-support', name: "Email Support", basic: "48h response", standard: "24h response", premium: "12h response" },
      { id: 'priority-support', name: "Priority Support", basic: false, standard: true, premium: true },
      { id: 'ai-chatbot', name: "AI Chatbot", basic: "10 msg/day", standard: "Unlimited", premium: "Unlimited" },
    ]
  },
  {
    id: 'data-reports',
    name: "Data & Reports",
    features: [
      { id: 'health-reports', name: "Health Reports", basic: false, standard: true, premium: true },
      { id: 'export-data', name: "Export Data", basic: false, standard: true, premium: true },
      { id: 'data-history', name: "Data History", basic: "7 days", standard: "30 days", premium: "90 days" },
      { id: 'analytics-dashboard', name: "Analytics Dashboard", basic: "Basic", standard: "Advanced", premium: "Full" },
      { id: 'download-reports', name: "Download Reports", basic: false, standard: true, premium: true },
    ]
  },
];

export default function PricingPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showFeatureTable, setShowFeatureTable] = useState(false);

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      icon: Shield,
      price: { month: 0, year: 0 },
      description: 'Essential pet care features',
      color: 'from-gray-500 to-gray-600',
      buttonColor: 'bg-gray-500 hover:bg-gray-600',
    },
    {
      id: 'standard',
      name: 'Standard',
      icon: Sparkles,
      price: { month: 2499, year: 11999 },
      description: 'Advanced features for pet parents',
      color: 'from-blue-500 to-blue-600',
      buttonColor: 'bg-blue-500 hover:bg-blue-600',
      popular: true,
    },
    {
      id: 'premium',
      name: 'Premium',
      icon: Crown,
      price: { month: 4999, year: 23999 },
      description: 'Complete pet care solution',
      color: 'from-yellow-500 to-yellow-600',
      buttonColor: 'bg-yellow-500 hover:bg-yellow-600',
    },
  ];

  const fetchSubscription = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (data && !error) {
      setCurrentSubscription(data as Subscription);
    } else {
      setCurrentSubscription(null);
    }
    setLoading(false);
  }, [user]);

  const fetchInvoices = useCallback(async () => {
    if (!user?.id) return;
    
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user.id)
      .order('invoice_date', { ascending: false });

    if (data && !error) {
      setInvoices(data as Invoice[]);
    }
  }, [user]);

useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  fetchSubscription();
  fetchInvoices();
}, [user, fetchSubscription, fetchInvoices]);
  const handleSubscribe = (planId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (currentSubscription?.plan_type === planId) {
      setError(`You are already on the ${planId} plan`);
      return;
    }
    
    // Check if upgrade is allowed
    const currentPlan = currentSubscription?.plan_type;
    
    // Premium users cannot change to any other plan
    if (currentPlan === 'premium') {
      setError('Premium users cannot downgrade. Please contact support for assistance.');
      return;
    }
    
    // Standard users can only upgrade to Premium (not downgrade to Basic)
    if (currentPlan === 'standard' && planId === 'basic') {
      setError('Standard users cannot downgrade to Basic. You can only upgrade to Premium.');
      return;
    }

    router.push(`/pricing/upgrade?plan=${planId}&cycle=${billingInterval}`);
  };

  const getDaysRemaining = () => {
    if (!currentSubscription?.end_date) return 0;
    const end = new Date(currentSubscription.end_date);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const renderFeatureValue = (value: FeatureValue) => {
    if (typeof value === 'boolean') {
      return value ? <CheckCircle className="h-5 w-5 text-green-500 mx-auto" /> : <XCircle className="h-5 w-5 text-red-400 mx-auto" />;
    }
    return <span className="text-sm">{value}</span>;
  };

  // Check if a plan upgrade is allowed
  const isUpgradeAllowed = (planId: string): boolean => {
    if (!currentSubscription) return true; // No subscription, can choose any
    
    const currentPlan = currentSubscription.plan_type;
    
    // Premium users cannot change to any plan
    if (currentPlan === 'premium') return false;
    
    // Standard users can only upgrade to Premium
    if (currentPlan === 'standard') {
      return planId === 'premium';
    }
    
    // Basic users can upgrade to Standard or Premium
    if (currentPlan === 'basic') {
      return planId === 'standard' || planId === 'premium';
    }
    
    return true;
  };

  const getButtonMessage = (planId: string): string => {
    if (!user) return "Sign Up to Subscribe";
    if (currentSubscription?.plan_type === planId) return "Current Plan";
    
    const currentPlan = currentSubscription?.plan_type;
    
    if (currentPlan === 'premium') return "Cannot Change";
    if (currentPlan === 'standard' && planId === 'basic') return "Cannot Downgrade";
    if (currentPlan === 'standard' && planId === 'premium') return `Upgrade to Premium`;
    if (currentPlan === 'basic') return `Upgrade to ${planId.charAt(0).toUpperCase() + planId.slice(1)}`;
    
    return `Subscribe ${billingInterval === 'month' ? 'Monthly' : 'Yearly'}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const isCurrentPlan = (planId: string) => currentSubscription?.plan_type === planId;
  const daysRemaining = getDaysRemaining();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Choose the Perfect Plan for Your Pet
          </h1>
          <p className="text-muted-foreground mt-2">
            Select the plan that best fits your needs. All plans include core features.
          </p>
        </div>

        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertDescription className="text-red-600">{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertDescription className="text-green-600">{success}</AlertDescription>
          </Alert>
        )}

        {user && currentSubscription && currentSubscription.status === 'active' && (
          <div className="mb-8">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-green-600" />
                      <h2 className="text-lg font-semibold">Current Plan: {currentSubscription.plan_type.toUpperCase()}</h2>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      Active since {new Date(currentSubscription.start_date).toLocaleDateString()}
                    </p>
                    {daysRemaining > 0 && (
                      <p className="text-sm text-green-700">
                        Next billing: {new Date(currentSubscription.end_date).toLocaleDateString()} ({daysRemaining} days remaining)
                      </p>
                    )}
                  </div>
                  {currentSubscription.plan_type === 'premium' && (
                    <div className="text-sm text-green-700 bg-green-100 px-3 py-1 rounded-full">
                      Premium Plan - Best Value!
                    </div>
                  )}
                  {currentSubscription.plan_type === 'standard' && (
                    <div className="text-sm text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                      You can upgrade to Premium
                    </div>
                  )}
                  {currentSubscription.plan_type === 'basic' && (
                    <div className="text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                      Upgrade to unlock more features
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {(!user || !currentSubscription) && (
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-full p-1 shadow-md inline-flex">
              <button
                onClick={() => setBillingInterval('month')}
                className={`px-6 py-2 rounded-full transition-all ${
                  billingInterval === 'month' 
                    ? 'bg-primary text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval('year')}
                className={`px-6 py-2 rounded-full transition-all ${
                  billingInterval === 'year' 
                    ? 'bg-primary text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Yearly <span className="text-xs ml-1 text-green-600">Save 15%</span>
              </button>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const price = billingInterval === 'month' ? plan.price.month : plan.price.year;
            const isActive = user ? isCurrentPlan(plan.id) : false;
            const upgradeAllowed = isUpgradeAllowed(plan.id);
            const buttonMessage = getButtonMessage(plan.id);
            
            let isDisabled = false;
            let disabledReason = '';
            
            if (user && currentSubscription) {
              if (currentSubscription.plan_type === 'premium') {
                isDisabled = true;
                disabledReason = 'Premium users cannot change plans';
              } else if (currentSubscription.plan_type === 'standard' && plan.id === 'basic') {
                isDisabled = true;
                disabledReason = 'Cannot downgrade from Standard to Basic';
              } else if (currentSubscription.plan_type === plan.id) {
                isDisabled = true;
                disabledReason = 'Current plan';
              } else if (!upgradeAllowed) {
                isDisabled = true;
              }
            }

            return (
              <Card key={plan.id} className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                isActive ? 'ring-2 ring-green-500 shadow-lg' : ''
              }`}>
                {plan.popular && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                      MOST POPULAR
                    </div>
                  </div>
                )}
                
                <CardHeader className={`bg-gradient-to-r ${plan.color} text-white rounded-t-lg`}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-6 w-6" />
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                  </div>
                  <CardDescription className="text-white/80">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-6">
                  <div className="mb-4">
                    {price === 0 ? (
                      <span className="text-3xl font-bold">Free</span>
                    ) : (
                      <>
                        <span className="text-4xl font-bold">LKR {price}</span>
                        <span className="text-muted-foreground">/{billingInterval === 'month' ? 'month' : 'year'}</span>
                      </>
                    )}
                  </div>

                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Core pet health tracking</span>
                    </li>
                    {plan.id !== 'basic' && (
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>AI-powered insights</span>
                      </li>
                    )}
                    {plan.id === 'premium' && (
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>Real-time sensor data</span>
                      </li>
                    )}
                  </ul>

                  {!user ? (
                    <Link href="/signup">
                      <Button className="w-full bg-gradient-to-r from-primary to-accent text-white">
                        Sign Up to Subscribe
                      </Button>
                    </Link>
                  ) : isActive ? (
                    <Button className="w-full bg-green-600 hover:bg-green-700" disabled>
                      Current Plan
                    </Button>
                  ) : isDisabled ? (
                    <Button 
                      className="w-full bg-gray-400 cursor-not-allowed" 
                      disabled
                      title={disabledReason}
                    >
                      {buttonMessage}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={processing === plan.id}
                      className={`w-full ${plan.buttonColor} text-white`}
                    >
                      {processing === plan.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CreditCard className="h-4 w-4 mr-2" />
                      )}
                      {buttonMessage}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mb-8">
          <Button
            onClick={() => setShowFeatureTable(!showFeatureTable)}
            variant={showFeatureTable ? "default" : "outline"}
            size="lg"
            className="gap-2 shadow-md hover:shadow-lg transition-all"
          >
            {showFeatureTable ? (
              <>Hide Complete Feature Comparison</>
            ) : (
              <>
                <Eye className="h-5 w-5" />
                View Complete Feature Comparison
              </>
            )}
          </Button>
        </div>

        {showFeatureTable && (
          <Card className="overflow-hidden shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Complete Feature Comparison
              </CardTitle>
              <CardDescription>Compare all features across Basic, Standard, and Premium plans</CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="text-left p-4 min-w-[200px]">Feature</th>
                    <th className="text-center p-4 min-w-[120px] bg-gray-50">Basic</th>
                    <th className="text-center p-4 min-w-[120px] bg-blue-50">Standard</th>
                    <th className="text-center p-4 min-w-[120px] bg-yellow-50">Premium</th>
                  </tr>
                </thead>
                <tbody>
                  {featureCategories.map((category) => (
                    <React.Fragment key={category.id}>
                      <tr className="bg-gray-50">
                        <td colSpan={4} className="p-3 font-semibold text-lg">
                          {category.name}
                         </td>
                       </tr>
                      {category.features.map((feature) => (
                        <tr key={feature.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{feature.name}</td>
                          <td className="text-center p-3">{renderFeatureValue(feature.basic)}</td>
                          <td className="text-center p-3 bg-blue-50/30">{renderFeatureValue(feature.standard)}</td>
                          <td className="text-center p-3 bg-yellow-50/30">{renderFeatureValue(feature.premium)}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {user && invoices.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Payment History
            </h2>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-4">Date</th>
                        <th className="text-left p-4">Plan</th>
                        <th className="text-left p-4">Amount</th>
                        <th className="text-left p-4">Status</th>
                        <th className="text-left p-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="border-b hover:bg-gray-50">
                          <td className="p-4">{new Date(invoice.invoice_date).toLocaleDateString()}</td>
                          <td className="p-4 capitalize">{invoice.plan_type}</td>
                          <td className="p-4">LKR {invoice.amount}</td>
                          <td className="p-4">
                            <Badge className="bg-green-100 text-green-700">Paid</Badge>
                          </td>
                          <td className="p-4">
                            <Button variant="ghost" size="sm" className="gap-1">
                              <FileText className="h-3 w-3" />
                              Receipt
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Need help choosing? <Link href="/contact" className="text-primary hover:underline">Contact our support team</Link>
          </p>
        </div>
      </div>
    </div>
  );
}