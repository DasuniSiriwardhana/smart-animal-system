"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, FileSpreadsheet, Calendar, 
  Users, DollarSign, Activity, Loader2,
  LineChart, PieChart as PieChartIcon,
  Mail, ChevronDown, Printer, Share2, RefreshCw,
  AlertTriangle, Heart, BarChart3
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Line
} from 'recharts';
import { supabase } from '@/lib/supabaseClient';

// ============================================
// PRICING CONFIGURATION
// ============================================
const PRICING = {
  basic: { monthly: 0, yearly: 0 },
  standard: { monthly: 2499, yearly: 11999 },
  premium: { monthly: 4999, yearly: 23999 }
} as const;

function getPlanPrice(planType: string, billingInterval: string = 'month'): number {
  const plan = planType?.toLowerCase() || 'basic';
  const interval = billingInterval?.toLowerCase() || 'month';
  if (plan === 'basic') return 0;
  if (plan === 'standard') {
    return interval === 'year' ? PRICING.standard.yearly : PRICING.standard.monthly;
  }
  if (plan === 'premium') {
    return interval === 'year' ? PRICING.premium.yearly : PRICING.premium.monthly;
  }
  return 0;
}

const COLORS: string[] = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

// ============================================
// TYPES
// ============================================

interface Profile {
  id: string;
  email: string;
  name: string | null;
  role: string;
  plan: string;
  created_at: string;
}

interface Subscription {
  id: string;
  user_id: string;
  plan_type: string;
  status: string;
  start_date: string;
  end_date: string | null;
  amount: number | null;
  billing_interval?: string; 
}

interface Payment {
  id: string;
  user_id: string;
  plan_type: string;
  amount: number;
  payment_date: string;
  status: string;
}

interface Invoice {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
  plan_type: string;
  billing_interval: string;
}

interface Pet {
  id: string;
  user_id: string;
  name: string;
  species: string;
  age: number | null;
  weight: number | null;
  created_at: string;
}

interface FeedingLog {
  id: string;
  pet_id: string;
  feeding_time: string;
  meal_type: string;
  confirmed: boolean;
  skipped: boolean;
}

interface Appointment {
  id: string;
  pet_id: string;
  appointment_date: string;
  appointment_time: string;
  vet_name: string;
  status: string;
  reason: string;
}

interface Medication {
  id: string;
  pet_id: string;
  name: string;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
}

interface HealthRecord {
  id: string;
  pet_id: string;
  record_date: string;
  temperature: number | null;
  weight: number | null;
  heart_rate: number | null;
}

interface Anomaly {
  id: string;
  pet_id: string;
  anomaly_date: string;
  anomaly_type: string;
  severity: string;
  description: string | null;
}

interface VetDocument {
  id: string;
  pet_id: string;
  doc_name: string;
  doc_category: string;
  doc_date: string;
}

interface Prediction {
  id: string;
  pet_id: string;
  health_score: number | null;
  trend: string;
  confidence: number | null;
}

interface RevenueTrendItem {
  date: string;
  revenue: number;
  subscriptions: number;
}

interface UserGrowthItem {
  date: string;
  newUsers: number;
  totalUsers: number;
}

interface PlanDistributionItem {
  name: string;
  value: number;
  color: string;
}

interface TopSpendingUser {
  email: string;
  totalSpent: number;
  expectedYearlySpend: number;
  plan: string;
  billingInterval: string;
}

interface ActivityMetrics {
  totalFeedings: number;
  avgFeedingsPerPet: number;
  activePets: number;
  inactivePets: number;
  totalAppointments: number;
  completedAppointments: number;
  upcomingAppointments: number;
  totalMedications: number;
  activeMedications: number;
  totalHealthRecords: number;
}

interface PetSpeciesItem {
  species: string;
  count: number;
  color: string;
}

interface AnomalyBySeverity {
  severity: string;
  count: number;
}

interface DocCategory {
  category: string;
  count: number;
}

interface UpcomingAppointment {
  pet_name: string;
  vet_name: string;
  date: string;
  time: string;
}

interface VetMetrics {
  totalDocuments: number;
  documentsByCategory: DocCategory[];
  upcomingAppointments: UpcomingAppointment[];
}

interface SummaryMetrics {
  totalRevenue: number;
  expectedMonthlyRevenue: number;
  totalUsers: number;
  newUsers: number;
  totalPets: number;
  activeSubscriptions: number;
  churnRate: number;
  avgRevenuePerUser: number;
  conversionRate: number;
}

interface ReportData {
  summary: SummaryMetrics;
  revenueTrend: RevenueTrendItem[];
  userGrowth: UserGrowthItem[];
  planDistribution: PlanDistributionItem[];
  topSpendingUsers: TopSpendingUser[];
  activityMetrics: ActivityMetrics;
  petSpeciesDistribution: PetSpeciesItem[];
  anomaliesBySeverity: AnomalyBySeverity[];
  vetMetrics: VetMetrics;
}

// ============================================
// DATE RANGE PICKER COMPONENT
// ============================================
function DateRangePicker({ 
  startDate, 
  endDate, 
  onStartChange, 
  onEndChange 
}: { 
  startDate: string; 
  endDate: string; 
  onStartChange: (date: string) => void;
  onEndChange: (date: string) => void;
}) {
  const presets = [
    { label: 'Last 7 Days', days: 7 },
    { label: 'Last 30 Days', days: 30 },
    { label: 'Last 90 Days', days: 90 },
    { label: 'This Year', days: 365 },
  ];

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartChange(e.target.value)}
          className="px-3 py-1.5 text-sm border rounded-lg bg-background"
        />
        <span className="text-muted-foreground">to</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndChange(e.target.value)}
          className="px-3 py-1.5 text-sm border rounded-lg bg-background"
        />
      </div>
      <div className="flex gap-2">
        {presets.map((preset) => (
          <Button
            key={preset.label}
            variant="outline"
            size="sm"
            onClick={() => {
              const end = new Date();
              const start = new Date();
              start.setDate(start.getDate() - preset.days);
              onStartChange(start.toISOString().split('T')[0]);
              onEndChange(end.toISOString().split('T')[0]);
            }}
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

// ============================================
// METRIC CARD COMPONENT
// ============================================
function MetricCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  const colorClasses: Record<string, string> = {
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
    pink: 'bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400',
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${colorClasses[color] || 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function AdminReportsPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [emailAddress, setEmailAddress] = useState<string>('');
  const [sendingEmail, setSendingEmail] = useState<boolean>(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('=== FETCHING REPORT DATA ===');
      console.log('Date range:', startDate, 'to', endDate);
      
      // Fetch all data
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email, name, role, plan, created_at') as { data: Profile[] | null };
      
      const { data: subscriptionsData } = await supabase
        .from('subscriptions')
        .select('id, user_id, plan_type, status, start_date, end_date, amount') as { data: Subscription[] | null };
      
      const { data: paymentsData } = await supabase
        .from('subscription_payments')
        .select('id, user_id, plan_type, amount, payment_date, status')
        .gte('payment_date', startDate)
        .lte('payment_date', endDate) as { data: Payment[] | null };
      
      // Fetch invoices data for top spending users
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('id, user_id, amount, status, created_at, plan_type, billing_interval')
        .gte('created_at', `${startDate}T00:00:00+00:00`)
        .lte('created_at', `${endDate}T23:59:59+00:00`) as { data: Invoice[] | null };
      
      const { data: petsData } = await supabase
        .from('pets')
        .select('id, user_id, name, species, age, weight, created_at') as { data: Pet[] | null };
      
      const { data: feedingLogsData } = await supabase
        .from('feeding_logs')
        .select('id, pet_id, feeding_time, meal_type, confirmed, skipped')
        .gte('feeding_time', `${startDate}T00:00:00+00:00`)
        .lte('feeding_time', `${endDate}T23:59:59+00:00`) as { data: FeedingLog[] | null };
      
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select('id, pet_id, appointment_date, appointment_time, vet_name, status, reason')
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate) as { data: Appointment[] | null };
      
      const { data: medicationsData } = await supabase
        .from('medications')
        .select('id, pet_id, name, is_active, start_date, end_date') as { data: Medication[] | null };
      
      const { data: healthRecordsData } = await supabase
        .from('health_records')
        .select('id, pet_id, record_date, temperature, weight, heart_rate')
        .gte('record_date', startDate)
        .lte('record_date', endDate) as { data: HealthRecord[] | null };
      
      const { data: allAnomaliesData, error: anomaliesError } = await supabase
        .from('anomalies')
        .select('id, pet_id, anomaly_date, anomaly_type, severity, description');
      
      if (anomaliesError) {
        console.error('Anomalies fetch error:', anomaliesError);
      }
      
      console.log('All anomalies in database:', allAnomaliesData?.length || 0);
      
      // Filter anomalies by date range
      const startDateTime = new Date(startDate);
      const endDateTime = new Date(endDate);
      startDateTime.setHours(0, 0, 0, 0);
      endDateTime.setHours(23, 59, 59, 999);
      
      const anomaliesData = (allAnomaliesData || []).filter((anomaly: Anomaly) => {
        const anomalyDate = new Date(anomaly.anomaly_date);
        return anomalyDate >= startDateTime && anomalyDate <= endDateTime;
      });
      
      console.log('Anomalies after date filter:', anomaliesData.length);
      
      const { data: vetDocumentsData } = await supabase
        .from('vet_documents')
        .select('id, pet_id, doc_name, doc_category, doc_date') as { data: VetDocument[] | null };
      
      const { data: predictionsData } = await supabase
        .from('predictions')
        .select('id, pet_id, health_score, trend, confidence') as { data: Prediction[] | null };
      
      const profiles: Profile[] = profilesData || [];
      const subscriptions: Subscription[] = subscriptionsData || [];
      const payments: Payment[] = paymentsData || [];
      const invoices: Invoice[] = invoicesData || [];
      const pets: Pet[] = petsData || [];
      const feedingLogs: FeedingLog[] = feedingLogsData || [];
      const appointments: Appointment[] = appointmentsData || [];
      const medications: Medication[] = medicationsData || [];
      const healthRecords: HealthRecord[] = healthRecordsData || [];
      const anomalies: Anomaly[] = anomaliesData || [];
      const vetDocuments: VetDocument[] = vetDocumentsData || [];
      const predictions: Prediction[] = predictionsData || [];

      // Calculate anomalies by severity
      const lowCount = anomalies.filter((a: Anomaly) => a.severity?.toLowerCase() === 'low').length;
      const mediumCount = anomalies.filter((a: Anomaly) => a.severity?.toLowerCase() === 'medium').length;
      const highCount = anomalies.filter((a: Anomaly) => a.severity?.toLowerCase() === 'high').length;
      
      const anomaliesBySeverity: AnomalyBySeverity[] = [
        { severity: 'Low', count: lowCount },
        { severity: 'Medium', count: mediumCount },
        { severity: 'High', count: highCount }
      ];
      
      console.log('Anomalies by severity calculated:', { lowCount, mediumCount, highCount });
      
      // Calculate summary metrics
      const totalRevenue: number = payments.reduce((sum: number, p: Payment) => sum + (p.amount || 0), 0);
      const totalUsers: number = profiles.length;
      const startDateObj: Date = new Date(startDate);
      const endDateObj: Date = new Date(endDate);
      const newUsers: number = profiles.filter((u: Profile) => {
        const createdAt: Date = new Date(u.created_at);
        return createdAt >= startDateObj && createdAt <= endDateObj;
      }).length;
      const totalPets: number = pets.length;
      const activeSubscriptions: number = subscriptions.filter((s: Subscription) => s.status === 'active').length;
      const expectedMonthlyRevenue: number = subscriptions
        .filter((s: Subscription) => s.status === 'active')
        .reduce((sum: number, s: Subscription) => sum + getPlanPrice(s.plan_type, 'month'), 0);
      const avgRevenuePerUser: number = totalUsers > 0 ? totalRevenue / totalUsers : 0;
      const conversionRate: number = totalUsers > 0 ? (activeSubscriptions / totalUsers) * 100 : 0;
      
      // Calculate revenue trend
      const revenueTrend: RevenueTrendItem[] = [];
      const start: Date = new Date(startDate);
      const end: Date = new Date(endDate);
      const paymentMap: Map<string, number> = new Map();
      
      payments.forEach((payment: Payment) => {
        const dateKey: string = new Date(payment.payment_date).toISOString().split('T')[0];
        paymentMap.set(dateKey, (paymentMap.get(dateKey) || 0) + payment.amount);
      });
      
      for (let d: Date = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateKey: string = d.toISOString().split('T')[0];
        revenueTrend.push({ date: dateKey, revenue: paymentMap.get(dateKey) || 0, subscriptions: 0 });
      }
      
      // Calculate user growth
      const userGrowth: UserGrowthItem[] = [];
      const userMap: Map<string, number> = new Map();
      let cumulativeUsers: number = 0;
      
      profiles.forEach((profile: Profile) => {
        const createdAt: Date = new Date(profile.created_at);
        if (createdAt >= startDateObj && createdAt <= endDateObj) {
          const dateKey: string = createdAt.toISOString().split('T')[0];
          userMap.set(dateKey, (userMap.get(dateKey) || 0) + 1);
        }
      });
      
      for (let d: Date = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateKey: string = d.toISOString().split('T')[0];
        const newUsersCount: number = userMap.get(dateKey) || 0;
        cumulativeUsers += newUsersCount;
        userGrowth.push({ date: dateKey, newUsers: newUsersCount, totalUsers: cumulativeUsers });
      }
      
      // Calculate plan distribution
      const activeSubsList: Subscription[] = subscriptions.filter((s: Subscription) => s.status === 'active');
      const planCounts: Record<string, number> = {};
      activeSubsList.forEach((sub: Subscription) => { 
        const plan: string = sub.plan_type || 'basic'; 
        planCounts[plan] = (planCounts[plan] || 0) + 1; 
      });
      
      const planDistribution: PlanDistributionItem[] = Object.entries(planCounts).map(([name, value]) => ({ 
        name: name.charAt(0).toUpperCase() + name.slice(1), 
        value, 
        color: name === 'premium' ? '#f59e0b' : name === 'standard' ? '#3b82f6' : '#6b7280' 
      }));
      
      // Calculate top spending users - FROM INVOICES TABLE
      const userSpending: Map<string, number> = new Map();
      
      // Aggregate from invoices (only paid/completed invoices)
      invoices.forEach((invoice: Invoice) => {
        if (invoice.status === 'paid' || invoice.status === 'completed') {
          const userId = invoice.user_id;
          const currentTotal = userSpending.get(userId) || 0;
          userSpending.set(userId, currentTotal + (invoice.amount || 0));
        }
      });
      
      // For users without any invoices, set to 0
      profiles.forEach((profile: Profile) => {
        if (!userSpending.has(profile.id)) {
          userSpending.set(profile.id, 0);
        }
      });
      
      const topSpendingUsers: TopSpendingUser[] = Array.from(userSpending.entries())
        .map(([userId, totalSpent]) => {
          const profile: Profile | undefined = profiles.find((p: Profile) => p.id === userId);
          
          // Get the user's latest active subscription
          const subscription: Subscription | undefined = subscriptions.find(
            (s: Subscription) => s.user_id === userId && s.status === 'active'
          );
          
          // Get the user's latest invoice to determine current plan
          const latestInvoice = invoices
            .filter((inv: Invoice) => inv.user_id === userId)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
          
          // Calculate expected yearly spend based on their current plan
          let expectedYearlySpend = 0;
          const currentPlan = subscription?.plan_type || latestInvoice?.plan_type || profile?.plan || 'basic';
          
          if (currentPlan === 'premium') {
            expectedYearlySpend = 23999; // Premium yearly
          } else if (currentPlan === 'standard') {
            expectedYearlySpend = 11999; // Standard yearly
          }
          
          return { 
            email: profile?.email || 'Unknown', 
            totalSpent, 
            expectedYearlySpend, 
            plan: currentPlan, 
            billingInterval: subscription?.billing_interval || latestInvoice?.billing_interval || 'month' 
          };
        })
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10);
      
      // Calculate activity metrics
      const totalFeedings: number = feedingLogs.filter((f: FeedingLog) => f.confirmed && !f.skipped).length;
      const thirtyDaysAgo: Date = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const activePets: number = pets.filter((pet: Pet) => 
        feedingLogs.filter((f: FeedingLog) => f.pet_id === pet.id && new Date(f.feeding_time) >= thirtyDaysAgo).length > 0
      ).length;
      const avgFeedingsPerPet: number = pets.length > 0 ? totalFeedings / pets.length : 0;
      const inactivePets: number = pets.length - activePets;
      const totalAppointments: number = appointments.length;
      const completedAppointments: number = appointments.filter((a: Appointment) => a.status === 'completed').length;
      const upcomingAppointments: number = appointments.filter((a: Appointment) => 
        a.status === 'scheduled' && new Date(a.appointment_date) >= new Date()
      ).length;
      const totalMedications: number = medications.length;
      const activeMedications: number = medications.filter((m: Medication) => m.is_active).length;
      const totalHealthRecords: number = healthRecords.length;
      
      // Calculate pet species distribution
      const speciesCountsMap: Record<string, number> = {};
      pets.forEach((pet: Pet) => { 
        const species: string = pet.species || 'Other'; 
        speciesCountsMap[species] = (speciesCountsMap[species] || 0) + 1; 
      });
      
      const petSpeciesDistribution: PetSpeciesItem[] = Object.entries(speciesCountsMap)
        .map(([species, count], index: number) => ({ species, count, color: COLORS[index % COLORS.length] }))
        .sort((a, b) => b.count - a.count);
      
      // Calculate vet metrics
      const totalDocuments: number = vetDocuments.length;
      const documentsByCategory: DocCategory[] = [
        { category: 'Vaccination', count: vetDocuments.filter((d: VetDocument) => d.doc_category === 'vaccination').length },
        { category: 'Medical', count: vetDocuments.filter((d: VetDocument) => d.doc_category === 'medical').length },
        { category: 'Prescription', count: vetDocuments.filter((d: VetDocument) => d.doc_category === 'prescription').length },
        { category: 'Lab', count: vetDocuments.filter((d: VetDocument) => d.doc_category === 'lab').length },
        { category: 'Other', count: vetDocuments.filter((d: VetDocument) => d.doc_category === 'other').length }
      ];
      
      const upcomingAppointmentsList: UpcomingAppointment[] = appointments
        .filter((a: Appointment) => a.status === 'scheduled' && new Date(a.appointment_date) >= new Date())
        .slice(0, 5)
        .map((a: Appointment) => {
          const pet: Pet | undefined = pets.find((p: Pet) => p.id === a.pet_id);
          return { pet_name: pet?.name || 'Unknown Pet', vet_name: a.vet_name, date: a.appointment_date, time: a.appointment_time };
        });
      
      const activityMetrics: ActivityMetrics = {
        totalFeedings,
        avgFeedingsPerPet: parseFloat(avgFeedingsPerPet.toFixed(1)),
        activePets,
        inactivePets,
        totalAppointments,
        completedAppointments,
        upcomingAppointments,
        totalMedications,
        activeMedications,
        totalHealthRecords
      };
      
      const vetMetrics: VetMetrics = {
        totalDocuments,
        documentsByCategory,
        upcomingAppointments: upcomingAppointmentsList
      };
      
      const summary: SummaryMetrics = {
        totalRevenue,
        expectedMonthlyRevenue,
        totalUsers,
        newUsers,
        totalPets,
        activeSubscriptions,
        churnRate: 0,
        avgRevenuePerUser: Math.round(avgRevenuePerUser),
        conversionRate: parseFloat(conversionRate.toFixed(1))
      };
      
      setReportData({
        summary,
        revenueTrend,
        userGrowth,
        planDistribution,
        topSpendingUsers,
        activityMetrics,
        petSpeciesDistribution,
        anomaliesBySeverity,
        vetMetrics
      });
      
      console.log('=== REPORT DATA SET ===');
      console.log('Top spending users:', topSpendingUsers);
      
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const exportToExcel = async (type: string): Promise<void> => {
    if (!reportData) return;
    setExporting(true);
    try {
      const wb = XLSX.utils.book_new();
      if (type === 'full' || type === 'summary') {
        const summaryData = [
          ['REPORT SUMMARY'], ['Period', `${startDate} to ${endDate}`], ['Generated', new Date().toLocaleString()], [''],
          ['METRIC', 'VALUE'],
          ['Total Revenue', `LKR ${reportData.summary.totalRevenue.toLocaleString()}`],
          ['Expected Monthly Revenue', `LKR ${reportData.summary.expectedMonthlyRevenue.toLocaleString()}`],
          ['Total Users', reportData.summary.totalUsers],
          ['New Users', reportData.summary.newUsers],
          ['Total Pets', reportData.summary.totalPets],
          ['Active Subscriptions', reportData.summary.activeSubscriptions],
          ['Avg Revenue Per User', `LKR ${reportData.summary.avgRevenuePerUser.toLocaleString()}`],
          ['Conversion Rate', `${reportData.summary.conversionRate}%`],
        ];
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
      }
      if (type === 'full' || type === 'revenue') {
        const revenueData = reportData.revenueTrend.map((r: RevenueTrendItem) => ({ 'Date': r.date, 'Revenue (LKR)': r.revenue, 'Subscriptions': r.subscriptions }));
        const wsRevenue = XLSX.utils.json_to_sheet(revenueData);
        XLSX.utils.book_append_sheet(wb, wsRevenue, 'Revenue Trend');
      }
      if (type === 'full' || type === 'users') {
        const userData = reportData.userGrowth.map((u: UserGrowthItem) => ({ 'Date': u.date, 'New Users': u.newUsers, 'Total Users': u.totalUsers }));
        const wsUsers = XLSX.utils.json_to_sheet(userData);
        XLSX.utils.book_append_sheet(wb, wsUsers, 'User Growth');
        const spenderData = reportData.topSpendingUsers.map((u: TopSpendingUser, i: number) => ({ 'Rank': i + 1, 'Email': u.email, 'Total Spent (LKR)': u.totalSpent, 'Yearly Value (LKR)': u.expectedYearlySpend, 'Plan': u.plan }));
        const wsSpenders = XLSX.utils.json_to_sheet(spenderData);
        XLSX.utils.book_append_sheet(wb, wsSpenders, 'Top Spenders');
      }
      const fileName = `report_${type}_${startDate}_to_${endDate}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  const exportReport = async (format: string, type: string): Promise<void> => {
    if (!reportData) return;
    await exportToExcel(type);
    setShowExportMenu(false);
  };

  const sendEmailReport = async (): Promise<void> => {
    if (!emailAddress) { alert('Please enter an email address'); return; }
    setSendingEmail(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert('Report sent successfully!');
      setShowEmailModal(false);
      setEmailAddress('');
    } catch (error) {
      console.error('Email error:', error);
      alert('Failed to send report');
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading report data...</p>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No data available</p>
        <Button onClick={fetchReportData} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">View and export business reports from your data</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchReportData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          
          <div className="relative" ref={exportMenuRef}>
            <Button className="gap-2 bg-gradient-to-r from-primary to-accent text-white shadow-md hover:shadow-lg transition-all" onClick={() => setShowExportMenu(!showExportMenu)} disabled={exporting}>
              {exporting ? <><Loader2 className="h-4 w-4 animate-spin" /> Exporting...</> : <><Download className="h-4 w-4" /> Export Report <ChevronDown className="h-4 w-4 ml-1" /></>}
            </Button>
            
            {showExportMenu && !exporting && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 border rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-3 bg-gradient-to-r from-primary/5 to-accent/5 border-b">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Export Options</p>
                </div>
                <div className="p-3 border-b">
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><FileSpreadsheet className="h-3 w-3 text-green-600" /> Excel Spreadsheet (.xlsx)</p>
                  <div className="grid grid-cols-2 gap-1">
                    <button onClick={() => exportReport('excel', 'full')} className="px-3 py-2 text-left text-sm hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"><span className="font-medium">Full Report</span><span className="text-xs text-gray-500 block">All data</span></button>
                    <button onClick={() => exportReport('excel', 'summary')} className="px-3 py-2 text-left text-sm hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"><span className="font-medium">Summary</span><span className="text-xs text-gray-500 block">Key metrics</span></button>
                    <button onClick={() => exportReport('excel', 'revenue')} className="px-3 py-2 text-left text-sm hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"><span className="font-medium">Revenue</span><span className="text-xs text-gray-500 block">Financial data</span></button>
                    <button onClick={() => exportReport('excel', 'users')} className="px-3 py-2 text-left text-sm hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"><span className="font-medium">Users</span><span className="text-xs text-gray-500 block">User growth</span></button>
                  </div>
                </div>
                <div className="p-3 border-b">
                  <button onClick={() => { setShowExportMenu(false); setShowEmailModal(true); }} className="w-full px-3 py-2 text-left text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-purple-600" /><div><span className="font-medium">Email Report</span><span className="text-xs text-gray-500 block">Send as attachment</span></div></div>
                    <ChevronDown className="h-4 w-4 text-purple-600 -rotate-90" />
                  </button>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800">
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => { window.print(); setShowExportMenu(false); }} className="px-3 py-2 text-left text-sm hover:bg-white dark:hover:bg-gray-700 rounded-lg flex items-center gap-2"><Printer className="h-4 w-4" /> Print</button>
                    <button onClick={() => { navigator.clipboard?.writeText(window.location.href); alert('Report link copied!'); setShowExportMenu(false); }} className="px-3 py-2 text-left text-sm hover:bg-white dark:hover:bg-gray-700 rounded-lg flex items-center gap-2"><Share2 className="h-4 w-4" /> Share Link</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Date Range */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <DateRangePicker startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Total Revenue" value={`LKR ${reportData.summary.totalRevenue.toLocaleString()}`} icon={DollarSign} color="green" />
        <MetricCard label="Total Users" value={reportData.summary.totalUsers.toLocaleString()} icon={Users} color="blue" />
        <MetricCard label="Active Subscriptions" value={reportData.summary.activeSubscriptions.toLocaleString()} icon={Activity} color="purple" />
        <MetricCard label="Total Pets" value={reportData.summary.totalPets.toLocaleString()} icon={Heart} color="pink" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><LineChart className="h-5 w-5" />Revenue Trend</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={reportData.revenueTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => `LKR ${value?.toLocaleString()}`} />
                      <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#d1fae5" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><PieChartIcon className="h-5 w-5" />Plan Distribution</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={reportData.planDistribution} cx="50%" cy="50%" outerRadius={80} label={({name, percent}) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`} dataKey="value">
                        {reportData.planDistribution.map((entry: PlanDistributionItem, idx: number) => <Cell key={idx} fill={entry.color || COLORS[idx % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><PieChartIcon className="h-5 w-5" />Pet Species Distribution</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={reportData.petSpeciesDistribution} cx="50%" cy="50%" outerRadius={80} label={({name, percent}) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`} dataKey="count" nameKey="species">
                        {reportData.petSpeciesDistribution.map((entry: PetSpeciesItem, idx: number) => <Cell key={idx} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Anomalies by Severity</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.anomaliesBySeverity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="severity" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader><CardTitle>Top Spending Users</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="p-3 text-left">Rank</th>
                      <th className="p-3 text-left">Email</th>
                      <th className="p-3 text-left">Plan</th>
                      <th className="p-3 text-right">Total Spent</th>
                      <th className="p-3 text-right">Yearly Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.topSpendingUsers.map((user: TopSpendingUser, idx: number) => (
                      <tr key={idx} className="border-t hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="p-3">#{idx + 1}</td>
                        <td className="p-3">{user.email}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            user.plan === 'premium' 
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : user.plan === 'standard'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                          }`}>
                            {user.plan}
                          </span>
                        </td>
                        <td className="p-3 text-right font-medium text-green-600 dark:text-green-400">
                          LKR {user.totalSpent.toLocaleString()}
                        </td>
                        <td className="p-3 text-right text-muted-foreground">
                          LKR {user.expectedYearlySpend.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Detailed Revenue Analysis</CardTitle></CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={reportData.revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" name="Revenue (LKR)" />
                    <Line yAxisId="right" type="monotone" dataKey="subscriptions" stroke="#f59e0b" name="Subscriptions" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>User Growth</CardTitle></CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={reportData.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="totalUsers" stroke="#8b5cf6" fill="#ede9fe" name="Total Users" />
                    <Bar dataKey="newUsers" fill="#3b82f6" name="New Users" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Feeding Activity</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span>Total Feedings</span>
                    <span className="font-bold text-xl">{reportData.activityMetrics.totalFeedings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span>Avg Feedings Per Pet</span>
                    <span className="font-bold text-xl">{reportData.activityMetrics.avgFeedingsPerPet.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span>Active Pets</span>
                    <span className="font-bold text-xl text-green-600 dark:text-green-400">{reportData.activityMetrics.activePets}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <span>Inactive Pets</span>
                    <span className="font-bold text-xl text-red-600 dark:text-red-400">{reportData.activityMetrics.inactivePets}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Healthcare Activity</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span>Total Appointments</span>
                    <span className="font-bold text-xl">{reportData.activityMetrics.totalAppointments}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span>Completed Appointments</span>
                    <span className="font-bold text-xl text-green-600 dark:text-green-400">{reportData.activityMetrics.completedAppointments}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <span>Upcoming Appointments</span>
                    <span className="font-bold text-xl text-yellow-600 dark:text-yellow-400">{reportData.activityMetrics.upcomingAppointments}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <span>Active Medications</span>
                    <span className="font-bold text-xl text-purple-600 dark:text-purple-400">{reportData.activityMetrics.activeMedications} / {reportData.activityMetrics.totalMedications}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle>Health Records Overview</CardTitle></CardHeader>
            <CardContent>
              <div className="p-6 text-center">
                <div className="text-4xl font-bold text-primary mb-2">{reportData.activityMetrics.totalHealthRecords}</div>
                <p className="text-muted-foreground">Total Health Records in Database</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Email Report Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Email Report</h2>
                  <p className="text-sm text-muted-foreground">Send this report to an email address</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Email Address</label>
                  <input
                    type="email"
                    placeholder="colleague@gmail.com"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  />
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500">Report Summary:</p>
                  <p className="text-sm">
                    Period: {startDate} to {endDate}<br />
                    Total Revenue: LKR {reportData.summary.totalRevenue.toLocaleString()}<br />
                    Total Users: {reportData.summary.totalUsers}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => { setShowEmailModal(false); setEmailAddress(''); }} className="flex-1">Cancel</Button>
                <Button onClick={sendEmailReport} disabled={sendingEmail} className="flex-1 gap-2">
                  {sendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  {sendingEmail ? 'Sending...' : 'Send Report'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}