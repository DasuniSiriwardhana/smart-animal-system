"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, FileSpreadsheet, Calendar, TrendingUp, 
  Users, DollarSign, Activity, Loader2,
  BarChart3, LineChart, RefreshCw, PieChart as PieChartIcon,
  FileText, Mail, ChevronDown, Printer, Share2, Check
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  LineChart as ReLineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, ComposedChart
} from 'recharts';

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
          className="px-3 py-1.5 text-sm border rounded-lg"
        />
        <span className="text-muted-foreground">to</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndChange(e.target.value)}
          className="px-3 py-1.5 text-sm border rounded-lg"
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

// Report Type Definition
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
  };
  petSpeciesDistribution: Array<{
    species: string;
    count: number;
  }>;
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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
  const [activeTab, setActiveTab] = useState('overview');

// Close dropdown when clicking outside
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

const exportToCSV = async (type: string) => {
  if (!reportData) return;
  
  let csvContent = '';
  
  if (type === 'full' || type === 'summary') {
    csvContent += 'METRIC,VALUE\n';
    csvContent += `Total Revenue,${reportData.summary.totalRevenue}\n`;
    csvContent += `Total Users,${reportData.summary.totalUsers}\n`;
    csvContent += `New Users,${reportData.summary.newUsers}\n`;
    csvContent += `Total Pets,${reportData.summary.totalPets}\n`;
    csvContent += `Active Subscriptions,${reportData.summary.activeSubscriptions}\n`;
    csvContent += `Churn Rate,${reportData.summary.churnRate}%\n`;
  }
  
  if (type === 'full' || type === 'revenue') {
    csvContent += '\nDATE,REVENUE,SUBSCRIPTIONS\n';
    reportData.revenueTrend.forEach(r => {
      csvContent += `${r.date},${r.revenue},${r.subscriptions}\n`;
    });
  }
  
  if (type === 'full' || type === 'users') {
    csvContent += '\nDATE,NEW_USERS,TOTAL_USERS\n';
    reportData.userGrowth.forEach(u => {
      csvContent += `${u.date},${u.newUsers},${u.totalUsers}\n`;
    });
  }
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `report_${type}_${startDate}_to_${endDate}.csv`;
  link.click();
};

const exportReport = async (format: 'excel' | 'csv', type: 'full' | 'summary' | 'revenue' | 'users') => {
  if (!reportData) return;
  
  setExportType(type);
  setExporting(true);
  
  try {
    if (format === 'excel') {
      await exportToExcel(type);
    } else if (format === 'csv') {
      await exportToCSV(type);
    }
  } catch (error) {
    console.error('Export error:', error);
    alert('Failed to export report');
  } finally {
    setExporting(false);
    setExportType('');
    setShowExportMenu(false);
  }
};

const sendEmailReport = async () => {
  if (!emailAddress) {
    alert('Please enter an email address');
    return;
  }
  
  setSendingEmail(true);
  try {
    const response = await fetch('/api/admin/send-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: emailAddress,
        startDate,
        endDate,
        reportData
      })
    });
    
    if (response.ok) {
      alert('Report sent successfully!');
      setShowEmailModal(false);
      setEmailAddress('');
    } else {
      throw new Error('Failed to send email');
    }
  } catch (error) {
    console.error('Email error:', error);
    alert('Failed to send report');
  } finally {
    setSendingEmail(false);
  }
};

const fetchReportData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/reports?startDate=${startDate}&endDate=${endDate}`);
      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = (type: 'full' | 'summary' | 'users' | 'revenue') => {
    if (!reportData) return;
    
    setExporting(true);
    try {
      const wb = XLSX.utils.book_new();
      
      if (type === 'full' || type === 'summary') {
        // Summary Sheet
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
        // Revenue Trend Sheet
        const revenueData = reportData.revenueTrend.map(r => ({
          'Date': r.date,
          'Revenue (LKR)': r.revenue,
          'Subscriptions': r.subscriptions
        }));
        const wsRevenue = XLSX.utils.json_to_sheet(revenueData);
        XLSX.utils.book_append_sheet(wb, wsRevenue, 'Revenue Trend');
      }
      
      if (type === 'full' || type === 'users') {
        // User Growth Sheet
        const userData = reportData.userGrowth.map(u => ({
          'Date': u.date,
          'New Users': u.newUsers,
          'Total Users': u.totalUsers
        }));
        const wsUsers = XLSX.utils.json_to_sheet(userData);
        XLSX.utils.book_append_sheet(wb, wsUsers, 'User Growth');
        
        // Top Spenders Sheet
        const spenderData = reportData.topSpendingUsers.map((u, i) => ({
          'Rank': i + 1,
          'Email': u.email,
          'Total Spent (LKR)': u.totalSpent,
          'Plan': u.plan
        }));
        const wsSpenders = XLSX.utils.json_to_sheet(spenderData);
        XLSX.utils.book_append_sheet(wb, wsSpenders, 'Top Spenders');
      }
      
      if (type === 'full') {
        // Plan Distribution Sheet
        const planData = reportData.planDistribution.map(p => ({
          'Plan': p.name,
          'Users': p.value
        }));
        const wsPlan = XLSX.utils.json_to_sheet(planData);
        XLSX.utils.book_append_sheet(wb, wsPlan, 'Plan Distribution');
        
        // Pet Species Sheet
        const speciesData = reportData.petSpeciesDistribution.map(s => ({
          'Species': s.species,
          'Count': s.count
        }));
        const wsSpecies = XLSX.utils.json_to_sheet(speciesData);
        XLSX.utils.book_append_sheet(wb, wsSpecies, 'Pet Species');
        
        // Activity Metrics Sheet
        const activityData = [
          ['METRIC', 'VALUE'],
          ['Total Feedings', reportData.activityMetrics.totalFeedings],
          ['Avg Feedings Per Pet', reportData.activityMetrics.avgFeedingsPerPet.toFixed(2)],
          ['Active Pets', reportData.activityMetrics.activePets],
          ['Inactive Pets', reportData.activityMetrics.inactivePets],
        ];
        const wsActivity = XLSX.utils.aoa_to_sheet(activityData);
        XLSX.utils.book_append_sheet(wb, wsActivity, 'Activity Metrics');
      }
      
      const fileName = `report_${type}_${startDate}_to_${endDate}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load report data</p>
        <Button onClick={fetchReportData} className="mt-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Generate and export business reports</p>
        </div>
        
        <div className="flex gap-2">
  <Button variant="outline" onClick={fetchReportData} className="gap-2">
    <RefreshCw className="h-4 w-4" />
    Refresh
  </Button>
  
  {/* Enhanced Export Dropdown */}
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
      <div className="absolute right-0 top-full mt-2 w-80 bg-white border rounded-xl shadow-xl z-50 overflow-hidden">
        <div className="p-3 bg-gradient-to-r from-primary/5 to-accent/5 border-b">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Export Options</p>
        </div>
        
        {/* Excel Export Options */}
        <div className="p-3 border-b">
          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
            <FileSpreadsheet className="h-3 w-3 text-green-600" />
            Excel Spreadsheet (.xlsx)
          </p>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => exportReport('excel', 'full')}
              className="px-3 py-2 text-left text-sm hover:bg-green-50 rounded-lg transition-colors"
            >
              <span className="font-medium">Full Report</span>
              <span className="text-xs text-gray-500 block">All data</span>
            </button>
            <button
              onClick={() => exportReport('excel', 'summary')}
              className="px-3 py-2 text-left text-sm hover:bg-green-50 rounded-lg transition-colors"
            >
              <span className="font-medium">Summary</span>
              <span className="text-xs text-gray-500 block">Key metrics</span>
            </button>
            <button
              onClick={() => exportReport('excel', 'revenue')}
              className="px-3 py-2 text-left text-sm hover:bg-green-50 rounded-lg transition-colors"
            >
              <span className="font-medium">Revenue</span>
              <span className="text-xs text-gray-500 block">Financial data</span>
            </button>
            <button
              onClick={() => exportReport('excel', 'users')}
              className="px-3 py-2 text-left text-sm hover:bg-green-50 rounded-lg transition-colors"
            >
              <span className="font-medium">Users</span>
              <span className="text-xs text-gray-500 block">User growth</span>
            </button>
          </div>
        </div>
        
        {/* CSV Export */}
        <div className="p-3 border-b">
          <button
            onClick={() => exportReport('csv', 'full')}
            className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <div>
                <span className="font-medium">CSV Format</span>
                <span className="text-xs text-gray-500 block">Comma-separated values</span>
              </div>
            </div>
            <Download className="h-4 w-4 text-blue-600" />
          </button>
        </div>
        
        {/* Email Report */}
        <div className="p-3 border-b">
          <button
            onClick={() => {
              setShowExportMenu(false);
              setShowEmailModal(true);
            }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-purple-50 rounded-lg transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-purple-600" />
              <div>
                <span className="font-medium">Email Report</span>
                <span className="text-xs text-gray-500 block">Send as attachment</span>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-purple-600 -rotate-90" />
          </button>
        </div>
        
        {/* Quick Actions */}
        <div className="p-3 bg-gray-50">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                window.print();
                setShowExportMenu(false);
              }}
              className="px-3 py-2 text-left text-sm hover:bg-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button
              onClick={() => {
                const url = window.location.href;
                navigator.clipboard?.writeText(url);
                alert('Report link copied!');
                setShowExportMenu(false);
              }}
              className="px-3 py-2 text-left text-sm hover:bg-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share Link
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
        <MetricCard 
          label="Total Revenue" 
          value={`LKR ${reportData.summary.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="green"
          trend={reportData.revenueTrend.length > 1 ? 
            ((reportData.revenueTrend[reportData.revenueTrend.length - 1].revenue / 
              reportData.revenueTrend[0].revenue - 1) * 100) : 0
          }
        />
        <MetricCard 
          label="Total Users" 
          value={reportData.summary.totalUsers.toLocaleString()}
          icon={Users}
          color="blue"
          trend={reportData.summary.newUsers > 0 ? 
            (reportData.summary.newUsers / reportData.summary.totalUsers * 100) : 0
          }
        />
        <MetricCard 
          label="Active Subscriptions" 
          value={reportData.summary.activeSubscriptions.toLocaleString()}
          icon={Activity}
          color="purple"
        />
        <MetricCard 
          label="Churn Rate" 
          value={`${reportData.summary.churnRate}%`}
          icon={TrendingUp}
          color={reportData.summary.churnRate > 10 ? 'red' : 'yellow'}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Revenue Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={reportData.revenueTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                        <Tooltip 
                            formatter={(value: unknown) => {
                                const numValue = typeof value === 'number' ? value : Number(value);
                                return isNaN(numValue) ? 'LKR 0' : `LKR ${numValue.toLocaleString()}`;
                            }}
                            />
                      <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#d1fae5" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                Plan Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportData.planDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => {
                            const pct = percent ?? 0;
                            return `${name}: ${(pct * 100).toFixed(0)}%`;
                            }}
                        dataKey="value"
                      >
                        {reportData.planDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Spending Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-left">Rank</th>
                      <th className="p-3 text-left">Email</th>
                      <th className="p-3 text-left">Plan</th>
                      <th className="p-3 text-right">Total Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.topSpendingUsers.slice(0, 10).map((user, idx) => (
                      <tr key={idx} className="border-t hover:bg-gray-50">
                        <td className="p-3">#{idx + 1}</td>
                        <td className="p-3">{user.email}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            user.plan === 'premium' ? 'bg-yellow-100 text-yellow-700' :
                            user.plan === 'standard' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {user.plan}
                          </span>
                        </td>
                        <td className="p-3 text-right font-medium text-green-600">
                          LKR {user.totalSpent.toLocaleString()}
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
            <CardHeader>
              <CardTitle>Detailed Revenue Analysis</CardTitle>
            </CardHeader>
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
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
            </CardHeader>
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
              <CardHeader>
                <CardTitle>Pet Species Distribution</CardTitle>
              </CardHeader>
                    <CardContent>
  {reportData.petSpeciesDistribution.length === 0 || 
   reportData.petSpeciesDistribution.every(s => s.count === 0) ? (
    <div className="h-64 flex flex-col items-center justify-center text-center">
      <PieChartIcon className="h-12 w-12 text-muted-foreground mb-2 opacity-50" />
      <p className="text-muted-foreground">No pet data available</p>
      <p className="text-xs text-muted-foreground mt-1">
        Add pets to see species distribution
      </p>
    </div>
  ) : (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={reportData.petSpeciesDistribution.filter(s => s.count > 0)}
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ name, percent }) => {
              const pct = percent ?? 0;
              return `${name}: ${(pct * 100).toFixed(0)}%`;
            }}
            dataKey="count"
            nameKey="species"
          >
            {reportData.petSpeciesDistribution
              .filter(s => s.count > 0)
              .map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )}
</CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activity Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span>Total Feedings</span>
                    <span className="font-bold text-xl">{reportData.activityMetrics.totalFeedings}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span>Avg Feedings Per Pet</span>
                    <span className="font-bold text-xl">{reportData.activityMetrics.avgFeedingsPerPet.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span>Active Pets</span>
                    <span className="font-bold text-xl text-green-600">{reportData.activityMetrics.activePets}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span>Inactive Pets</span>
                    <span className="font-bold text-xl text-red-600">{reportData.activityMetrics.inactivePets}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Email Report Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Email Report</h2>
                  <p className="text-sm text-muted-foreground">
                    Send this report to an email address
                  </p>
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
                    className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Report Summary:</p>
                  <p className="text-sm">
                    Period: {startDate} to {endDate}<br />
                    Total Revenue: LKR {reportData?.summary.totalRevenue.toLocaleString()}<br />
                    Total Users: {reportData?.summary.totalUsers}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEmailModal(false);
                    setEmailAddress('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={sendEmailReport}
                  disabled={sendingEmail}
                  className="flex-1 gap-2"
                >
                  {sendingEmail ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
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
function MetricCard({ 
  label, 
  value, 
  icon: Icon, 
  color, 
  trend 
}: { 
  label: string; 
  value: string | number; 
  icon: React.ElementType; 
  color: string;
  trend?: number;
}) {
  const colorClasses = {
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
  }[color] || 'bg-gray-50 text-gray-600';

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend !== undefined && (
              <p className={`text-xs ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
              </p>
            )}
          </div>
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${colorClasses}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}