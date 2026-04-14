import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

interface ForecastData {
  month: string;
  forecast: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

export async function GET() {
  try {
    // Get historical revenue data
    const { data: invoices } = await supabase
      .from('invoices')
      .select('amount, invoice_date')
      .eq('status', 'paid')
      .order('invoice_date', { ascending: true });
    
    // Group by month
    const monthlyRevenue: Record<string, number> = {};
    invoices?.forEach(inv => {
      const date = new Date(inv.invoice_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyRevenue[key] = (monthlyRevenue[key] || 0) + (inv.amount || 0);
    });
    
    // Convert to array and sort
    const historicalData = Object.entries(monthlyRevenue)
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month));
    
    // Calculate growth rate and seasonality
    const growthRates: number[] = [];
    for (let i = 1; i < historicalData.length; i++) {
      const prev = historicalData[i - 1].revenue;
      const curr = historicalData[i].revenue;
      if (prev > 0) {
        growthRates.push((curr - prev) / prev);
      }
    }
    
    const avgGrowthRate = growthRates.length > 0
      ? growthRates.reduce((a, b) => a + b, 0) / growthRates.length
      : 0.05;
    
    // Detect seasonality
    const seasonalFactors: number[] = Array(12).fill(1);
    if (historicalData.length >= 12) {
      for (let month = 0; month < 12; month++) {
        const monthRevenues = historicalData
          .filter((_, i) => i % 12 === month)
          .map(d => d.revenue);
        
        if (monthRevenues.length > 0) {
          const avg = monthRevenues.reduce((a, b) => a + b, 0) / monthRevenues.length;
          const overallAvg = historicalData.reduce((a, b) => a + b.revenue, 0) / historicalData.length;
          seasonalFactors[month] = avg / overallAvg;
        }
      }
    }
    
    // Generate forecast
    const forecast: ForecastData[] = [];
    const lastRevenue = historicalData[historicalData.length - 1]?.revenue || 10000;
    const lastDate = historicalData[historicalData.length - 1] 
      ? new Date(historicalData[historicalData.length - 1].month + '-01')
      : new Date();
    
    for (let i = 1; i <= 12; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setMonth(forecastDate.getMonth() + i);
      const monthKey = `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, '0')}`;
      const monthIndex = forecastDate.getMonth();
      
      const baseForecast = lastRevenue * Math.pow(1 + avgGrowthRate, i);
      const seasonalAdjustment = seasonalFactors[monthIndex];
      const forecastValue = Math.round(baseForecast * seasonalAdjustment);
      
      const volatility = growthRates.length > 0
        ? Math.sqrt(growthRates.reduce((sum, r) => sum + Math.pow(r - avgGrowthRate, 2), 0) / growthRates.length)
        : 0.1;
      
      forecast.push({
        month: monthKey,
        forecast: forecastValue,
        lowerBound: Math.round(forecastValue * (1 - volatility * 1.96)),
        upperBound: Math.round(forecastValue * (1 + volatility * 1.96)),
        confidence: Math.round((1 - volatility) * 100)
      });
    }
    
    const currentARR = (historicalData[historicalData.length - 1]?.revenue || 0) * 12;
    const forecastARR = forecast[11]?.forecast ? forecast[11].forecast * 12 : currentARR;
    
    return NextResponse.json({
      historical: historicalData.slice(-12),
      forecast,
      metrics: {
        avgMonthlyGrowth: Math.round(avgGrowthRate * 1000) / 10 + '%',
        currentARR: Math.round(currentARR),
        forecastARR: Math.round(forecastARR),
        projectedGrowth: Math.round(((forecastARR / currentARR) - 1) * 1000) / 10 + '%',
        seasonalFactors: seasonalFactors.map((f, i) => ({
          month: new Date(2024, i).toLocaleString('default', { month: 'short' }),
          factor: Math.round(f * 100) / 100
        }))
      }
    });
    
  } catch (err) {
    console.error('Forecast error:', err);
    return NextResponse.json({ error: 'Failed to generate forecast' }, { status: 500 });
  }
}