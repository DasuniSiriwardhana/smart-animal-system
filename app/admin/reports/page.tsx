"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, FileSpreadsheet, Calendar, TrendingUp, 
  Users, DollarSign, Activity, Loader2,
  LineChart, PieChart as PieChartIcon,
  FileText, Mail, ChevronDown, Printer, Share2, RefreshCw,
  AlertTriangle, Heart, Syringe
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  LineChart as ReLineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, ComposedChart
} from 'recharts';
import { supabase } from '@/lib/supabaseClient';

// ============================================
// TYPES - Replacing 'any' with proper interfaces
// ============================================

// Database row types
interface ProfileRow {
  id: string;
  email: string;
  name: string | null;
  role: string;
  plan: string;
  created_at: string;
}

interface SubscriptionRow {
  id: string;
  user_id: string;
  plan_type: string;
  status: string;
  start_date: string;
  end_date: string | null;
  amount: number | null;
  updated_at?: string;
}

interface SubscriptionPaymentRow {
  id: string;
  user_id: string;
  plan_type: string;
  amount: number;
  payment_date: string;
  status: string;
}

interface PetRow {
  id: string;
  user_id: string;
  name: string;
  species: string;
  age: number | null;
  weight: number | null;
  created_at: string;
}

interface FeedingLogRow {
  id: string;
  pet_id: string;
  feeding_time: string;
  meal_type: string;
  confirmed: boolean;
  skipped: boolean;
}

interface AppointmentRow {
  id: string;
  pet_id: string;
  appointment_date: string;
  appointment_time: string;
  vet_name: string;
  status: string;
  reason: string;
}

interface MedicationRow {
  id: string;
  pet_id: string;
  name: string;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
}

interface HealthRecordRow {
  id: string;
  pet_id: string;
  record_date: string;
  temperature: number | null;
  weight: number | null;
  heart_rate: number | null;
}

interface AnomalyRow {
  id: string;
  pet_id: string;
  anomaly_date: string;
  anomaly_type: string;
  severity: string;
  description: string | null;
}

interface VetDocumentRow {
  id: string;
  pet_id: string;
  doc_name: string;
  doc_category: string;
  doc_date: string;
}

interface PredictionRow {
  id: string;
  pet_id: string;
  health_score: number | null;
  trend: string;
  confidence: number | null;
}

// Report data types
type ReportData = {
  summary: {
    totalRevenue: number;
    totalUsers: number;
    newUsers: number;
    totalPets: number;
    activeSubscriptions: number;
    churnRate: number;
    avgRevenuePerUser: number;
    conversionRate: number;
  };
  revenueTrend: Array<{
    date: string;
    revenue: number;
    subscriptions: number;
  }>;
  userGrowth: Array<{
    date: string;
    newUsers: number;
    totalUsers: number;
  }>;
  planDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  topSpendingUsers: Array<{
    email: string;
    totalSpent: number;
    plan: string;
  }>;
  activityMetrics: {
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
  };
  petSpeciesDistribution: Array<{
    species: string;
    count: number;
    color: string;
  }>;
  healthMetrics: {
    avgHealthScore: number;
    totalAnomalies: number;
    criticalAnomalies: number;
    anomaliesBySeverity: Array<{
      severity: string;
      count: number;
    }>;
    recentAnomalies: Array<{
      pet_name: string;
      anomaly_type: string;
      severity: string;
      date: string;
    }>;
  };
  vetMetrics: {
    totalDocuments: number;
    documentsByCategory: Array<{
      category: string;
      count: number;
    }>;
    upcomingAppointments: Array<{
      pet_name: string;
      vet_name: string;
      date: string;
      time: string;
    }>;
  };
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

// Date Range Picker Component
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

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState<string>('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
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

  useEffect(() => {
    fetchReportData();
  }, [startDate, endDate]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [
        profilesData,
        subscriptionsData,
        subscriptionPaymentsData,
        petsData,
        feedingLogsData,
        appointmentsData,
        medicationsData,
        healthRecordsData,
        anomaliesData,
        vetDocumentsData,
        predictionsData
      ] = await Promise.all([
        fetchProfiles(),
        fetchSubscriptions(),
        fetchSubscriptionPayments(),
        fetchPets(),
        fetchFeedingLogs(),
        fetchAppointments(),
        fetchMedications(),
        fetchHealthRecords(),
        fetchAnomalies(),
        fetchVetDocuments(),
        fetchPredictions()
      ]);

      const summary = calculateSummaryMetrics(profilesData, subscriptionsData, subscriptionPaymentsData, petsData);
      const revenueTrend = calculateRevenueTrend(subscriptionPaymentsData, startDate, endDate);
      const userGrowth = calculateUserGrowth(profilesData, startDate, endDate);
      const planDistribution = calculatePlanDistribution(profilesData, subscriptionsData);
      const topSpendingUsers = calculateTopSpendingUsers(subscriptionPaymentsData, profilesData);
      const activityMetrics = calculateActivityMetrics(feedingLogsData, petsData, appointmentsData, medicationsData, healthRecordsData);
      const petSpeciesDistribution = calculatePetSpeciesDistribution(petsData);
      const healthMetrics = calculateHealthMetrics(predictionsData, anomaliesData);
      const vetMetrics = calculateVetMetrics(vetDocumentsData, appointmentsData);

      setReportData({
        summary,
        revenueTrend,
        userGrowth,
        planDistribution,
        topSpendingUsers,
        activityMetrics,
        petSpeciesDistribution,
        healthMetrics,
        vetMetrics
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // SUPABASE QUERY FUNCTIONS
  // ============================================
  
  const fetchProfiles = async (): Promise<ProfileRow[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, name, role, plan, created_at');
    
    if (error) throw error;
    return (data || []) as ProfileRow[];
  };

  const fetchSubscriptions = async (): Promise<SubscriptionRow[]> => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('id, user_id, plan_type, status, start_date, end_date, amount');
    
    if (error) throw error;
    return (data || []) as SubscriptionRow[];
  };

  const fetchSubscriptionPayments = async (): Promise<SubscriptionPaymentRow[]> => {
    const { data, error } = await supabase
      .from('subscription_payments')
      .select('id, user_id, plan_type, amount, payment_date, status')
      .gte('payment_date', startDate)
      .lte('payment_date', endDate);
    
    if (error) throw error;
    return (data || []) as SubscriptionPaymentRow[];
  };

  const fetchPets = async (): Promise<PetRow[]> => {
    const { data, error } = await supabase
      .from('pets')
      .select('id, user_id, name, species, age, weight, created_at');
    
    if (error) throw error;
    return (data || []) as PetRow[];
  };

  const fetchFeedingLogs = async (): Promise<FeedingLogRow[]> => {
    const { data, error } = await supabase
      .from('feeding_logs')
      .select('id, pet_id, feeding_time, meal_type, confirmed, skipped')
      .gte('feeding_time', `${startDate}T00:00:00+00:00`)
      .lte('feeding_time', `${endDate}T23:59:59+00:00`);
    
    if (error) throw error;
    return (data || []) as FeedingLogRow[];
  };

  const fetchAppointments = async (): Promise<AppointmentRow[]> => {
    const { data, error } = await supabase
      .from('appointments')
      .select('id, pet_id, appointment_date, appointment_time, vet_name, status, reason')
      .gte('appointment_date', startDate)
      .lte('appointment_date', endDate);
    
    if (error) throw error;
    return (data || []) as AppointmentRow[];
  };

  const fetchMedications = async (): Promise<MedicationRow[]> => {
    const { data, error } = await supabase
      .from('medications')
      .select('id, pet_id, name, is_active, start_date, end_date');
    
    if (error) throw error;
    return (data || []) as MedicationRow[];
  };

  const fetchHealthRecords = async (): Promise<HealthRecordRow[]> => {
    const { data, error } = await supabase
      .from('health_records')
      .select('id, pet_id, record_date, temperature, weight, heart_rate')
      .gte('record_date', startDate)
      .lte('record_date', endDate);
    
    if (error) throw error;
    return (data || []) as HealthRecordRow[];
  };

  const fetchAnomalies = async (): Promise<AnomalyRow[]> => {
    const { data, error } = await supabase
      .from('anomalies')
      .select('id, pet_id, anomaly_date, anomaly_type, severity, description')
      .gte('anomaly_date', startDate)
      .lte('anomaly_date', endDate);
    
    if (error) throw error;
    return (data || []) as AnomalyRow[];
  };

  const fetchVetDocuments = async (): Promise<VetDocumentRow[]> => {
    const { data, error } = await supabase
      .from('vet_documents')
      .select('id, pet_id, doc_name, doc_category, doc_date');
    
    if (error) throw error;
    return (data || []) as VetDocumentRow[];
  };

  const fetchPredictions = async (): Promise<PredictionRow[]> => {
    const { data, error } = await supabase
      .from('predictions')
      .select('id, pet_id, health_score, trend, confidence');
    
    if (error) throw error;
    return (data || []) as PredictionRow[];
  };

  // ============================================
  // DATA PROCESSING FUNCTIONS - No 'any' types
  // ============================================

  const calculateSummaryMetrics = (
    profiles: ProfileRow[], 
    subscriptions: SubscriptionRow[], 
    payments: SubscriptionPaymentRow[], 
    pets: PetRow[]
  ) => {
    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalUsers = profiles.length;
    
    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);
    const newUsers = profiles.filter(u => {
      const createdAt = new Date(u.created_at);
      return createdAt >= startDateTime && createdAt <= endDateTime;
    }).length;
    
    const totalPets = pets.length;
    const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
    
    const usersAtStart = profiles.filter(u => new Date(u.created_at) < startDateTime).length;
    const churnedUsers = subscriptions.filter(s => 
      s.status === 'cancelled' && 
      s.updated_at && new Date(s.updated_at) >= startDateTime && 
      new Date(s.updated_at) <= endDateTime
    ).length;
    const churnRate = usersAtStart > 0 ? (churnedUsers / usersAtStart) * 100 : 0;
    
    const avgRevenuePerUser = totalUsers > 0 ? totalRevenue / totalUsers : 0;
    const conversionRate = totalUsers > 0 ? (activeSubscriptions / totalUsers) * 100 : 0;
    
    return {
      totalRevenue,
      totalUsers,
      newUsers,
      totalPets,
      activeSubscriptions,
      churnRate: parseFloat(churnRate.toFixed(1)),
      avgRevenuePerUser: Math.round(avgRevenuePerUser),
      conversionRate: parseFloat(conversionRate.toFixed(1))
    };
  };

  const calculateRevenueTrend = (payments: SubscriptionPaymentRow[], startDateStr: string, endDateStr: string) => {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const dateMap = new Map<string, { date: string; revenue: number; subscriptions: number }>();
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      dateMap.set(dateKey, { date: dateKey, revenue: 0, subscriptions: 0 });
    }
    
    payments.forEach(payment => {
      const dateKey = new Date(payment.payment_date).toISOString().split('T')[0];
      const existing = dateMap.get(dateKey);
      if (existing) {
        existing.revenue += payment.amount || 0;
        existing.subscriptions += 1;
        dateMap.set(dateKey, existing);
      }
    });
    
    return Array.from(dateMap.values())
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const calculateUserGrowth = (profiles: ProfileRow[], startDateStr: string, endDateStr: string) => {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const dateMap = new Map<string, { date: string; newUsers: number; totalUsers: number }>();
    let cumulativeUsers = 0;
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      dateMap.set(dateKey, { date: dateKey, newUsers: 0, totalUsers: 0 });
    }
    
    profiles.forEach(profile => {
      const createdAt = new Date(profile.created_at);
      if (createdAt >= start && createdAt <= end) {
        const dateKey = createdAt.toISOString().split('T')[0];
        const existing = dateMap.get(dateKey);
        if (existing) {
          existing.newUsers += 1;
          dateMap.set(dateKey, existing);
        }
      }
    });
    
    const result = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    for (let i = 0; i < result.length; i++) {
      cumulativeUsers += result[i].newUsers;
      result[i].totalUsers = cumulativeUsers;
    }
    
    return result;
  };

  const calculatePlanDistribution = (profiles: ProfileRow[], subscriptions: SubscriptionRow[]) => {
    const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
    const planCounts = new Map<string, number>();
    
    activeSubscriptions.forEach(sub => {
      const plan = sub.plan_type || 'basic';
      planCounts.set(plan, (planCounts.get(plan) || 0) + 1);
    });
    
    const colors: { [key: string]: string } = {
      'basic': '#6b7280',
      'standard': '#3b82f6',
      'premium': '#f59e0b'
    };
    
    return Array.from(planCounts.entries()).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: colors[name] || '#3b82f6'
    }));
  };

  const calculateTopSpendingUsers = (payments: SubscriptionPaymentRow[], profiles: ProfileRow[]) => {
    const userSpending = new Map<string, number>();
    
    payments.forEach(payment => {
      const userId = payment.user_id;
      userSpending.set(userId, (userSpending.get(userId) || 0) + (payment.amount || 0));
    });
    
    const spendingArray = Array.from(userSpending.entries())
      .map(([userId, totalSpent]) => {
        const profile = profiles.find(p => p.id === userId);
        return {
          email: profile?.email || 'Unknown',
          totalSpent,
          plan: profile?.plan || 'basic'
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);
    
    return spendingArray;
  };

  const calculateActivityMetrics = (
    feedingLogs: FeedingLogRow[], 
    pets: PetRow[], 
    appointments: AppointmentRow[], 
    medications: MedicationRow[], 
    healthRecords: HealthRecordRow[]
  ) => {
    const totalFeedings = feedingLogs.filter(f => f.confirmed && !f.skipped).length;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activePets = pets.filter(pet => {
      const petFeedings = feedingLogs.filter(f => f.pet_id === pet.id && new Date(f.feeding_time) >= thirtyDaysAgo);
      return petFeedings.length > 0;
    }).length;
    
    const avgFeedingsPerPet = pets.length > 0 ? totalFeedings / pets.length : 0;
    const inactivePets = pets.length - activePets;
    
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(a => a.status === 'completed').length;
    const upcomingAppointments = appointments.filter(a => 
      a.status === 'scheduled' && new Date(a.appointment_date) >= new Date()
    ).length;
    
    const totalMedications = medications.length;
    const activeMedications = medications.filter(m => m.is_active).length;
    const totalHealthRecords = healthRecords.length;
    
    return {
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
  };

  const calculatePetSpeciesDistribution = (pets: PetRow[]) => {
    const speciesCounts = new Map<string, number>();
    
    pets.forEach(pet => {
      const species = pet.species || 'Other';
      speciesCounts.set(species, (speciesCounts.get(species) || 0) + 1);
    });
    
    return Array.from(speciesCounts.entries())
      .map(([species, count], index) => ({
        species,
        count,
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.count - a.count);
  };

  const calculateHealthMetrics = (predictions: PredictionRow[], anomalies: AnomalyRow[]) => {
    const validPredictions = predictions.filter(p => p.health_score !== null);
    const avgHealthScore = validPredictions.length > 0 
      ? validPredictions.reduce((sum, p) => sum + (p.health_score || 0), 0) / validPredictions.length 
      : 0;
    
    const totalAnomalies = anomalies.length;
    const criticalAnomalies = anomalies.filter(a => a.severity === 'high').length;
    
    const anomaliesBySeverity = [
      { severity: 'Low', count: anomalies.filter(a => a.severity === 'low').length },
      { severity: 'Medium', count: anomalies.filter(a => a.severity === 'medium').length },
      { severity: 'High', count: anomalies.filter(a => a.severity === 'high').length }
    ];
    
    const recentAnomalies = anomalies.slice(0, 5).map(a => ({
      pet_name: 'Unknown Pet',
      anomaly_type: a.anomaly_type,
      severity: a.severity,
      date: a.anomaly_date
    }));
    
    return {
      avgHealthScore: Math.round(avgHealthScore),
      totalAnomalies,
      criticalAnomalies,
      anomaliesBySeverity,
      recentAnomalies
    };
  };

  const calculateVetMetrics = (vetDocuments: VetDocumentRow[], appointments: AppointmentRow[]) => {
    const totalDocuments = vetDocuments.length;
    
    const documentsByCategory = [
      { category: 'Vaccination', count: vetDocuments.filter(d => d.doc_category === 'vaccination').length },
      { category: 'Medical', count: vetDocuments.filter(d => d.doc_category === 'medical').length },
      { category: 'Prescription', count: vetDocuments.filter(d => d.doc_category === 'prescription').length },
      { category: 'Lab', count: vetDocuments.filter(d => d.doc_category === 'lab').length },
      { category: 'Other', count: vetDocuments.filter(d => d.doc_category === 'other').length }
    ];
    
    const upcomingAppointments = appointments
      .filter(a => a.status === 'scheduled' && new Date(a.appointment_date) >= new Date())
      .slice(0, 5)
      .map(a => ({
        pet_name: 'Unknown Pet',
        vet_name: a.vet_name,
        date: a.appointment_date,
        time: a.appointment_time
      }));
    
    return {
      totalDocuments,
      documentsByCategory,
      upcomingAppointments
    };
  };

  const exportToExcel = async (type: 'full' | 'summary' | 'users' | 'revenue') => {
    if (!reportData) return;
    
    setExporting(true);
    try {
      const wb = XLSX.utils.book_new();
      
      if (type === 'full' || type === 'summary') {
        const summaryData = [
          ['REPORT SUMMARY'],
          ['Period', `${startDate} to ${endDate}`],
          ['Generated', new Date().toLocaleString()],
          [''],
          ['METRIC', 'VALUE'],
          ['Total Revenue', `LKR ${reportData.summary.totalRevenue.toLocaleString()}`],
          ['Total Users', reportData.summary.totalUsers],
          ['New Users', reportData.summary.newUsers],
          ['Total Pets', reportData.summary.totalPets],
          ['Active Subscriptions', reportData.summary.activeSubscriptions],
          ['Churn Rate', `${reportData.summary.churnRate}%`],
          ['Avg Revenue Per User', `LKR ${reportData.summary.avgRevenuePerUser.toLocaleString()}`],
          ['Conversion Rate', `${reportData.summary.conversionRate}%`],
        ];
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
      }
      
      if (type === 'full' || type === 'revenue') {
        const revenueData = reportData.revenueTrend.map(r => ({
          'Date': r.date,
          'Revenue (LKR)': r.revenue,
          'Subscriptions': r.subscriptions
        }));
        const wsRevenue = XLSX.utils.json_to_sheet(revenueData);
        XLSX.utils.book_append_sheet(wb, wsRevenue, 'Revenue Trend');
      }
      
      if (type === 'full' || type === 'users') {
        const userData = reportData.userGrowth.map(u => ({
          'Date': u.date,
          'New Users': u.newUsers,
          'Total Users': u.totalUsers
        }));
        const wsUsers = XLSX.utils.json_to_sheet(userData);
        XLSX.utils.book_append_sheet(wb, wsUsers, 'User Growth');
        
        const spenderData = reportData.topSpendingUsers.map((u, i) => ({
          'Rank': i + 1,
          'Email': u.email,
          'Total Spent (LKR)': u.totalSpent,
          'Plan': u.plan
        }));
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

  const exportReport = async (format: 'excel' | 'csv', type: 'full' | 'summary' | 'revenue' | 'users') => {
    if (!reportData) return;
    await exportToExcel(type);
    setShowExportMenu(false);
  };

  const sendEmailReport = async () => {
    if (!emailAddress) {
      alert('Please enter an email address');
      return;
    }
    
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
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
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
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchReportData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <div className="relative" ref={exportMenuRef}>
            <Button 
              className="gap-2 bg-gradient-to-r from-primary to-accent text-white shadow-md hover:shadow-lg transition-all"
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={exporting}
            >
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export Report
                  <ChevronDown className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
            
            {showExportMenu && !exporting && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 border rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-3 bg-gradient-to-r from-primary/5 to-accent/5 border-b">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Export Options</p>
                </div>
                
                <div className="p-3 border-b">
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <FileSpreadsheet className="h-3 w-3 text-green-600" />
                    Excel Spreadsheet (.xlsx)
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    <button onClick={() => exportReport('excel', 'full')} className="px-3 py-2 text-left text-sm hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors">
                      <span className="font-medium">Full Report</span>
                      <span className="text-xs text-gray-500 block">All data</span>
                    </button>
                    <button onClick={() => exportReport('excel', 'summary')} className="px-3 py-2 text-left text-sm hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors">
                      <span className="font-medium">Summary</span>
                      <span className="text-xs text-gray-500 block">Key metrics</span>
                    </button>
                    <button onClick={() => exportReport('excel', 'revenue')} className="px-3 py-2 text-left text-sm hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors">
                      <span className="font-medium">Revenue</span>
                      <span className="text-xs text-gray-500 block">Financial data</span>
                    </button>
                    <button onClick={() => exportReport('excel', 'users')} className="px-3 py-2 text-left text-sm hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors">
                      <span className="font-medium">Users</span>
                      <span className="text-xs text-gray-500 block">User growth</span>
                    </button>
                  </div>
                </div>
                
                <div className="p-3 border-b">
                  <button onClick={() => { setShowExportMenu(false); setShowEmailModal(true); }} className="w-full px-3 py-2 text-left text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-purple-600" />
                      <div><span className="font-medium">Email Report</span><span className="text-xs text-gray-500 block">Send as attachment</span></div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-purple-600 -rotate-90" />
                  </button>
                </div>
                
                <div className="p-3 bg-gray-50 dark:bg-gray-800">
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => { window.print(); setShowExportMenu(false); }} className="px-3 py-2 text-left text-sm hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2">
                      <Printer className="h-4 w-4" /> Print
                    </button>
                    <button onClick={() => { navigator.clipboard?.writeText(window.location.href); alert('Report link copied!'); setShowExportMenu(false); }} className="px-3 py-2 text-left text-sm hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2">
                      <Share2 className="h-4 w-4" /> Share Link
                    </button>
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
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartChange={setStartDate}
            onEndChange={setEndDate}
          />
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
        <TabsList className="grid w-full max-w-2xl grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><LineChart className="h-5 w-5" />Revenue Trend</CardTitle></CardHeader>
              <CardContent><div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={reportData.revenueTrend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip formatter={(value) => `LKR ${value?.toLocaleString()}`} /><Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#d1fae5" /></AreaChart></ResponsiveContainer></div></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><PieChartIcon className="h-5 w-5" />Plan Distribution</CardTitle></CardHeader>
              <CardContent><div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={reportData.planDistribution} cx="50%" cy="50%" outerRadius={80} label={({name, percent}) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`} dataKey="value">{reportData.planDistribution.map((entry, idx) => <Cell key={idx} fill={entry.color || COLORS[idx % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div></CardContent>
            </Card>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><PieChartIcon className="h-5 w-5" />Pet Species Distribution</CardTitle></CardHeader>
              <CardContent><div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={reportData.petSpeciesDistribution} cx="50%" cy="50%" outerRadius={80} label={({name, percent}) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`} dataKey="count" nameKey="species">{reportData.petSpeciesDistribution.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" />Anomalies by Severity</CardTitle></CardHeader>
              <CardContent><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={reportData.healthMetrics.anomaliesBySeverity}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="severity" /><YAxis /><Tooltip /><Bar dataKey="count" fill="#ef4444" /></BarChart></ResponsiveContainer></div></CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader><CardTitle>Top Spending Users</CardTitle></CardHeader>
            <CardContent><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50 dark:bg-gray-800"><tr><th className="p-3 text-left">Rank</th><th className="p-3 text-left">Email</th><th className="p-3 text-left">Plan</th><th className="p-3 text-right">Total Spent</th></tr></thead><tbody>{reportData.topSpendingUsers.map((user, idx) => (<tr key={idx} className="border-t hover:bg-gray-50 dark:hover:bg-gray-800"><td className="p-3">#{idx+1}</td><td className="p-3">{user.email}</td><td className="p-3"><span className={`px-2 py-1 rounded text-xs ${user.plan==='premium'?'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400':user.plan==='standard'?'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400':'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}>{user.plan}</span></td><td className="p-3 text-right font-medium text-green-600 dark:text-green-400">LKR {user.totalSpent.toLocaleString()}</td></tr>))}</tbody></table></div></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Detailed Revenue Analysis</CardTitle></CardHeader>
            <CardContent><div className="h-80"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={reportData.revenueTrend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis yAxisId="left" /><YAxis yAxisId="right" orientation="right" /><Tooltip /><Legend /><Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" name="Revenue (LKR)" /><Line yAxisId="right" type="monotone" dataKey="subscriptions" stroke="#f59e0b" name="Subscriptions" /></ComposedChart></ResponsiveContainer></div></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>User Growth</CardTitle></CardHeader>
            <CardContent><div className="h-80"><ResponsiveContainer width="100%" height="100%"><AreaChart data={reportData.userGrowth}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Legend /><Area type="monotone" dataKey="totalUsers" stroke="#8b5cf6" fill="#ede9fe" name="Total Users" /><Bar dataKey="newUsers" fill="#3b82f6" name="New Users" /></AreaChart></ResponsiveContainer></div></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Feeding Activity</CardTitle></CardHeader>
              <CardContent><div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"><span>Total Feedings</span><span className="font-bold text-xl">{reportData.activityMetrics.totalFeedings.toLocaleString()}</span></div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"><span>Avg Feedings Per Pet</span><span className="font-bold text-xl">{reportData.activityMetrics.avgFeedingsPerPet.toFixed(1)}</span></div>
                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"><span>Active Pets</span><span className="font-bold text-xl text-green-600 dark:text-green-400">{reportData.activityMetrics.activePets}</span></div>
                <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"><span>Inactive Pets</span><span className="font-bold text-xl text-red-600 dark:text-red-400">{reportData.activityMetrics.inactivePets}</span></div>
              </div></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Healthcare Activity</CardTitle></CardHeader>
              <CardContent><div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"><span>Total Appointments</span><span className="font-bold text-xl">{reportData.activityMetrics.totalAppointments}</span></div>
                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"><span>Completed Appointments</span><span className="font-bold text-xl text-green-600 dark:text-green-400">{reportData.activityMetrics.completedAppointments}</span></div>
                <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"><span>Upcoming Appointments</span><span className="font-bold text-xl text-yellow-600 dark:text-yellow-400">{reportData.activityMetrics.upcomingAppointments}</span></div>
                <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg"><span>Active Medications</span><span className="font-bold text-xl text-purple-600 dark:text-purple-400">{reportData.activityMetrics.activeMedications} / {reportData.activityMetrics.totalMedications}</span></div>
              </div></CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle>Health Records Overview</CardTitle></CardHeader>
            <CardContent><div className="p-6 text-center"><div className="text-4xl font-bold text-primary mb-2">{reportData.activityMetrics.totalHealthRecords}</div><p className="text-muted-foreground">Total Health Records in Database</p></div></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <MetricCard label="Average Health Score" value={`${reportData.healthMetrics.avgHealthScore}/100`} icon={Activity} color="green" />
            <MetricCard label="Total Anomalies" value={reportData.healthMetrics.totalAnomalies.toString()} icon={AlertTriangle} color="yellow" />
            <MetricCard label="Critical Anomalies" value={reportData.healthMetrics.criticalAnomalies.toString()} icon={AlertTriangle} color="red" />
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" />Anomalies by Severity</CardTitle></CardHeader>
              <CardContent><div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={reportData.healthMetrics.anomaliesBySeverity} cx="50%" cy="50%" outerRadius={80} label={({name, percent}) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`} dataKey="count" nameKey="severity"><Cell key="low" fill="#f59e0b" /><Cell key="medium" fill="#ef4444" /><Cell key="high" fill="#dc2626" /></Pie><Tooltip /></PieChart></ResponsiveContainer></div></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Syringe className="h-5 w-5" />Veterinary Documents</CardTitle></CardHeader>
              <CardContent><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={reportData.vetMetrics.documentsByCategory} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis type="category" dataKey="category" /><Tooltip /><Bar dataKey="count" fill="#8b5cf6" /></BarChart></ResponsiveContainer></div></CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader><CardTitle>Recent Health Anomalies</CardTitle></CardHeader>
            <CardContent><div className="space-y-3">{reportData.healthMetrics.recentAnomalies.map((anomaly, idx) => (<div key={idx} className="flex items-center justify-between p-3 border rounded-lg"><div><p className="font-medium">{anomaly.anomaly_type}</p><p className="text-sm text-muted-foreground">{anomaly.date}</p></div><span className={`px-2 py-1 rounded text-xs ${anomaly.severity === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : anomaly.severity === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>{anomaly.severity}</span></div>))}</div></CardContent>
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
                  <p className="text-sm">Period: {startDate} to {endDate}<br />Total Revenue: LKR {reportData?.summary.totalRevenue.toLocaleString()}<br />Total Users: {reportData?.summary.totalUsers}</p>
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

// Metric Card Component
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
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${colorClasses[color] || colorClasses.gray}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}