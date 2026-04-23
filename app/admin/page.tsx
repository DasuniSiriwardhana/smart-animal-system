"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, PawPrint, DollarSign, Activity, 
  TrendingUp, Award, Loader2, RefreshCw, Star
} from 'lucide-react';
import Link from 'next/link';
import { ChurnDashboard } from '@/components/admin/ChurnDashboard';

type DashboardStats = {
  totalUsers: number;
  totalPets: number;
  totalRevenue: number;
  activeToday: number;
  pendingReviews: number;
  monthlyNewUsers: number;
  monthlyRevenue: number;
};

type TopBrand = {
  brand: string;
  total_sales: number;
  customer_count: number;
};

type RecentUser = {
  id: string;
  email: string;
  name: string;
  created_at: string;
  plan: string;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPets: 0,
    totalRevenue: 0,
    activeToday: 0,
    pendingReviews: 0,
    monthlyNewUsers: 0,
    monthlyRevenue: 0,
  });
  const [topBrands, setTopBrands] = useState<TopBrand[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadTopBrands(),
        loadRecentUsers(),
      ]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Total pets
      const { count: petsCount } = await supabase
        .from('pets')
        .select('*', { count: 'exact', head: true });

      // Total revenue from subscription_payments
      const { data: paymentsData } = await supabase
        .from('subscription_payments')
        .select('amount');
      
      const totalRevenue = paymentsData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

      // Monthly revenue (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: monthlyPayments } = await supabase
        .from('subscription_payments')
        .select('amount')
        .gte('payment_date', thirtyDaysAgo.toISOString().split('T')[0]);
      
      const monthlyRevenue = monthlyPayments?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

      // Pending reviews (only bad reviews with rating <= 3 that are not approved)
      const { count: pendingCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', false)
        .eq('type', 'review')
        .lte('rating', 3);

      // Monthly new users
      const { count: newUsersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Active today (users with sensor data in last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { data: activeSensorData } = await supabase
        .from('sensor_data')
        .select('pet_id')
        .gte('sensor_time', yesterday.toISOString());

      let activeUsers = 0;
      if (activeSensorData && activeSensorData.length > 0) {
        const uniquePetIds = [...new Set(activeSensorData.map(s => s.pet_id))];
        const { data: petsWithUsers } = await supabase
          .from('pets')
          .select('user_id')
          .in('id', uniquePetIds);
        const uniqueUsers = [...new Set(petsWithUsers?.map(p => p.user_id) || [])];
        activeUsers = uniqueUsers.length;
      }

      setStats({
        totalUsers: usersCount || 0,
        totalPets: petsCount || 0,
        totalRevenue: totalRevenue,
        activeToday: activeUsers,
        pendingReviews: pendingCount || 0,
        monthlyNewUsers: newUsersCount || 0,
        monthlyRevenue: monthlyRevenue,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadTopBrands = async () => {
    try {
      const { data } = await supabase
        .from('market_aggregates')
        .select('brand, total_sales, customer_count')
        .not('brand', 'is', null)
        .order('total_sales', { ascending: false })
        .limit(5);
      
      if (data) setTopBrands(data as TopBrand[]);
    } catch (error) {
      console.error('Error loading top brands:', error);
    }
  };

  const loadRecentUsers = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, email, name, created_at, plan')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (data) setRecentUsers(data as RecentUser[]);
    } catch (error) {
      console.error('Error loading recent users:', error);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="churn">Churn Analysis</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview">
        <div>
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">Platform overview and key metrics</p>
            </div>
            <Button variant="outline" onClick={refreshData} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-3xl font-bold">{stats.totalUsers.toLocaleString()}</p>
                    <p className="text-xs text-green-600 mt-1">+{stats.monthlyNewUsers} this month</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Pets</p>
                    <p className="text-3xl font-bold">{stats.totalPets.toLocaleString()}</p>
                  </div>
                  <PawPrint className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">LKR {(stats.totalRevenue / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-green-600 mt-1">+LKR {(stats.monthlyRevenue / 1000).toFixed(0)}K this month</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Today</p>
                    <p className="text-3xl font-bold">{stats.activeToday}</p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <Link href="/admin/reviews">
              <Card className="hover:shadow-lg transition-all cursor-pointer border-red-200 bg-gradient-to-r from-red-50 to-orange-50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-700">Pending Bad Reviews</p>
                      <p className="text-3xl font-bold text-red-600">{stats.pendingReviews}</p>
                      <p className="text-sm text-red-600 mt-1">Reviews with rating ≤ 3</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-red-200 flex items-center justify-center">
                      <Star className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/users">
              <Card className="hover:shadow-lg transition-all cursor-pointer border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">User Management</p>
                      <p className="text-2xl font-bold text-blue-600">View All Users</p>
                      <p className="text-sm text-blue-600 mt-1">Manage profiles & plans</p>
                    </div>
                    <Users className="h-12 w-12 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Recent Users */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Recent Signups
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No users yet
                </div>
              ) : (
                <div className="space-y-3">
                  {recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{user.name || user.email.split('@')[0]}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{new Date(user.created_at).toLocaleDateString()}</p>
                        <p className="text-xs text-muted-foreground capitalize">{user.plan} plan</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Brands */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Top Performing Brands
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topBrands.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No brand data available yet
                </div>
              ) : (
                <div className="space-y-4">
                  {topBrands.map((brand, idx) => (
                    <div key={brand.brand} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                          #{idx + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{brand.brand}</p>
                          <p className="text-sm text-muted-foreground">{brand.customer_count} customers</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600 text-xl">LKR {(brand.total_sales / 1000).toFixed(0)}K</p>
                        <p className="text-xs text-muted-foreground">total sales</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>
      
      <TabsContent value="churn">
        <ChurnDashboard />
      </TabsContent>
    </Tabs>
  );
}