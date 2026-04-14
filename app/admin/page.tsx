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
  totalSales: number;
  activeToday: number;
  pendingReviews: number;
};

type TopBrand = {
  brand: string;
  total_sales: number;
  customer_count: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPets: 0,
    totalSales: 0,
    activeToday: 0,
    pendingReviews: 0,
  });
  const [topBrands, setTopBrands] = useState<TopBrand[]>([]);
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
      ]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: petsCount } = await supabase
        .from('pets')
        .select('*', { count: 'exact', head: true });

      const { data: salesData } = await supabase
        .from('market_aggregates')
        .select('total_sales');
      
      const totalSales = salesData?.reduce((sum, item) => sum + (item.total_sales || 0), 0) || 0;

      const { count: pendingCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', false);

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
        totalSales: totalSales,
        activeToday: activeUsers,
        pendingReviews: pendingCount || 0,
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
                    <p className="text-3xl font-bold">{stats.totalUsers}</p>
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
                    <p className="text-3xl font-bold">{stats.totalPets}</p>
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
                    <p className="text-2xl font-bold">LKR {(stats.totalSales / 1000).toFixed(0)}K</p>
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
              <Card className="hover:shadow-lg transition-all cursor-pointer border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-700">Pending Reviews</p>
                      <p className="text-3xl font-bold text-yellow-600">{stats.pendingReviews}</p>
                      <p className="text-sm text-yellow-600 mt-1">Click to moderate</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-yellow-200 flex items-center justify-center">
                      <Star className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/market">
              <Card className="hover:shadow-lg transition-all cursor-pointer border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">Market Analysis</p>
                      <p className="text-2xl font-bold text-blue-600">View Insights</p>
                      <p className="text-sm text-blue-600 mt-1">Brands & Sales Data</p>
                    </div>
                    <TrendingUp className="h-12 w-12 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

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