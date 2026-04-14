"use client";

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

import { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';

type ChurnPrediction = {
  id: string;
  user_id: string;
  churn_probability: number;
  churn_risk: string;
  prediction_date: string;
};

type RiskByPlanData = {
  plan: string;
  risk: number;
  count: number;
};

const RISK_COLORS: Record<string, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#7f1d1d'
};

//  Type-safe formatter (NO any)
const formatPercentage = (value: ValueType): string | string[] => {
  if (Array.isArray(value)) {
    return value.map(v => `${Number(v).toFixed(1)}%`);
  }

  if (typeof value === 'number') {
    return `${value.toFixed(1)}%`;
  }

  if (typeof value === 'string') {
    return `${Number(value).toFixed(1)}%`;
  }

  return '0%';
};

export function ChurnDashboard() {
  const [predictions, setPredictions] = useState<ChurnPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [riskByPlan, setRiskByPlan] = useState<RiskByPlanData[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const { data: predictionsData, error: predictionsError } = await supabase
        .from('churn_predictions')
        .select('*')
        .order('prediction_date', { ascending: false });

      if (predictionsError) {
        console.error('Error fetching predictions:', predictionsError);
        return;
      }

      if (!predictionsData) return;

      setPredictions(predictionsData);

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, plan');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      if (!profilesData) return;

      const planMap = new Map(profilesData.map(p => [p.id, p.plan]));

      const calculatedRiskByPlan: RiskByPlanData[] = ['basic', 'standard', 'premium']
        .map(plan => {
          const users = predictionsData.filter(p => planMap.get(p.user_id) === plan);

          const avgRisk =
            users.length > 0
              ? users.reduce((sum, u) => sum + u.churn_probability, 0) / users.length
              : 0;

          return {
            plan: plan.toUpperCase(),
            risk: avgRisk * 100,
            count: users.length
          };
        })
        .filter(r => r.count > 0);

      setRiskByPlan(calculatedRiskByPlan);

    } catch (error) {
      console.error('Error in fetchData:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const refreshData = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Stats
  const totalCustomers = predictions.length;

  const avgChurnRate =
    totalCustomers > 0
      ? predictions.reduce((sum, p) => sum + p.churn_probability, 0) / totalCustomers
      : 0;

  const atRiskCount = predictions.filter(p =>
    p.churn_risk === 'high' || p.churn_risk === 'critical'
  ).length;

  const healthyCount = predictions.filter(p => p.churn_risk === 'low').length;

  const riskDistribution = [
    { name: 'Low Risk', value: predictions.filter(p => p.churn_risk === 'low').length, color: RISK_COLORS.low },
    { name: 'Medium Risk', value: predictions.filter(p => p.churn_risk === 'medium').length, color: RISK_COLORS.medium },
    { name: 'High Risk', value: predictions.filter(p => p.churn_risk === 'high').length, color: RISK_COLORS.high },
    { name: 'Critical', value: predictions.filter(p => p.churn_risk === 'critical').length, color: RISK_COLORS.critical }
  ].filter(r => r.value > 0);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const atRiskCustomers = predictions
    .filter(p => p.churn_risk === 'high' || p.churn_risk === 'critical')
    .sort((a, b) => b.churn_probability - a.churn_probability)
    .slice(0, 10);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Churn Prediction Dashboard</h2>
          <p className="text-muted-foreground">Auto-refreshes every 5 minutes</p>
        </div>
        <button
          onClick={refreshData}
          disabled={refreshing}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Customers" value={totalCustomers} />
        <StatCard label="Avg Churn Risk" value={`${(avgChurnRate * 100).toFixed(1)}%`} />
        <StatCard label="At Risk Customers" value={atRiskCount} className="text-red-600" />
        <StatCard label="Healthy Customers" value={healthyCount} className="text-green-600" />
      </div>

      {/* Pie Chart */}
      <ChartCard title="Risk Distribution">
        <PieChart>
          <Pie
            data={riskDistribution}
            dataKey="value"
            nameKey="name"
            outerRadius={100}
            label={({ name, percent }) =>
              `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
            }
          >
            {riskDistribution.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ChartCard>

      {/* Bar Chart */}
      {riskByPlan.length > 0 && (
        <ChartCard title="Risk by Subscription Plan">
          <BarChart data={riskByPlan}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="plan" />
            <YAxis domain={[0, 100]} unit="%" />
            <Tooltip formatter={(value) => {
  if (value === undefined || value === null) return '0%';
  if (Array.isArray(value)) return `${value[0]}%`;
  return `${value}%`;
}} />         
        
        <Bar dataKey="risk" fill="#3b82f6" name="Churn Risk" />
          </BarChart>
        </ChartCard>
      )}

      {/* Table */}
      {atRiskCustomers.length > 0 && (
        <div className="bg-white rounded-lg p-4 shadow border">
          <h3 className="text-lg font-semibold mb-4">⚠️ At Risk Customers</h3>
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>User</th>
                <th>Risk</th>
                <th>Probability</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {atRiskCustomers.map(c => (
                <tr key={c.id}>
                  <td>{c.user_id.slice(0, 8)}...</td>
                  <td>
                    <span className={`px-2 py-1 rounded ${getRiskColor(c.churn_risk)}`}>
                      {c.churn_risk}
                    </span>
                  </td>
                  <td>{(c.churn_probability * 100).toFixed(1)}%</td>
                  <td>{new Date(c.prediction_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}

//  Small reusable UI components
function StatCard({ label, value, className = '' }: { label: string; value: string | number; className?: string }) {
  return (
    <div className="bg-white rounded-lg p-4 shadow border">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${className}`}>{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg p-4 shadow border">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}