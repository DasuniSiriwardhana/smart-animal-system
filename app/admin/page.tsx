// app/admin/page.tsx
"use client"

import { AuthGuard } from "@/components/auth/auth-guard"
import { useState } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Map, 
  Calendar,
  Download,
  PawPrint
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

// Mock data
const marketShareData = [
  { brand: "Royal Canin", share: 34, sales: "LKR 816K", trend: "+12%" },
  { brand: "Hill's Science", share: 28, sales: "LKR 672K", trend: "+5%" },
  { brand: "Whiskas", share: 22, sales: "LKR 528K", trend: "-3%" },
  { brand: "Pedigree", share: 16, sales: "LKR 384K", trend: "+2%" },
]

const geographicData = [
  { district: "Colombo", pets: 12450, topBrand: "Royal Canin", avgSpend: 8500 },
  { district: "Kandy", pets: 8320, topBrand: "Annamal", avgSpend: 5200 },
  { district: "Galle", pets: 6540, topBrand: "Hill's", avgSpend: 4800 },
  { district: "Jaffna", pets: 4320, topBrand: "Local", avgSpend: 3800 },
  { district: "Kurunegala", pets: 3980, topBrand: "Pedigree", avgSpend: 3500 },
]

const seasonalData = [
  { season: "Kitten Season (Dec-Jan)", products: ["Royal Canin Kitten", "Wet Food"], demand: "+45%" },
  { season: "Summer (Apr-Aug)", products: ["Hydration Supplements", "Cooling Mats"], demand: "+67%" },
  { season: "Festive (Apr)", products: ["Premium Treats", "Gift Boxes"], demand: "+112%" },
  { season: "Monsoon", products: ["Joint Supplements", "Indoor Toys"], demand: "+53%" },
]

export default function AdminPage() {
  const [dateRange, setDateRange] = useState("30d")

  return (
    <AuthGuard requiredRole="admin">
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Market intelligence & platform analytics</p>
            </div>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>

          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Pets</p>
                    <p className="text-2xl font-bold">45,678</p>
                    <p className="text-xs text-green-600">↑ 12.3%</p>
                  </div>
                  <PawPrint className="h-8 w-8 text-primary/50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Users</p>
                    <p className="text-2xl font-bold">12,345</p>
                    <p className="text-xs text-green-600">↑ 8.7%</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500/50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Market Size</p>
                    <p className="text-2xl font-bold">LKR 2.4M</p>
                    <p className="text-xs text-green-600">↑ 15.2%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500/50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Spend</p>
                    <p className="text-2xl font-bold">LKR 5,250</p>
                    <p className="text-xs text-green-600">↑ 5.4%</p>
                  </div>
                  <ShoppingBag className="h-8 w-8 text-orange-500/50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Tabs */}
          <Tabs defaultValue="market" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="market">Market Share</TabsTrigger>
              <TabsTrigger value="geographic">Geographic</TabsTrigger>
              <TabsTrigger value="seasonal">Seasonal Trends</TabsTrigger>
              <TabsTrigger value="insights">AI Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="market">
              <Card>
                <CardHeader>
                  <CardTitle>Brand Market Share</CardTitle>
                  <CardDescription>Top pet food brands in Sri Lanka</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Brand</TableHead>
                        <TableHead>Market Share</TableHead>
                        <TableHead>Sales (30d)</TableHead>
                        <TableHead>Trend</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {marketShareData.map((item) => (
                        <TableRow key={item.brand}>
                          <TableCell className="font-medium">{item.brand}</TableCell>
                          <TableCell>{item.share}%</TableCell>
                          <TableCell>{item.sales}</TableCell>
                          <TableCell>
                            <Badge variant={item.trend.startsWith('+') ? 'default' : 'destructive'}>
                              {item.trend}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="geographic">
              <Card>
                <CardHeader>
                  <CardTitle>Geographic Distribution</CardTitle>
                  <CardDescription>Pet population by district</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>District</TableHead>
                        <TableHead>Pet Population</TableHead>
                        <TableHead>Top Brand</TableHead>
                        <TableHead>Avg. Monthly Spend</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {geographicData.map((item) => (
                        <TableRow key={item.district}>
                          <TableCell className="font-medium">{item.district}</TableCell>
                          <TableCell>{item.pets.toLocaleString()}</TableCell>
                          <TableCell>{item.topBrand}</TableCell>
                          <TableCell>LKR {item.avgSpend.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seasonal">
              <Card>
                <CardHeader>
                  <CardTitle>Seasonal Trends</CardTitle>
                  <CardDescription>Demand patterns throughout the year</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {seasonalData.map((item) => (
                      <Card key={item.season}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold">{item.season}</h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                Top products: {item.products.join(", ")}
                              </p>
                            </div>
                            <Badge variant="default" className="bg-green-100 text-green-700">
                              {item.demand}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights">
              <Card>
                <CardHeader>
                  <CardTitle>AI Market Insights</CardTitle>
                  <CardDescription>Predictive analytics for pet industry</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="font-medium text-blue-700">📈 Trending</p>
                      <p className="text-sm mt-1">Fresh food delivery up 312% in Western Province</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="font-medium text-green-700">🔮 Prediction</p>
                      <p className="text-sm mt-1">Kitten food demand to increase 45% in December</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <p className="font-medium text-orange-700">💰 Opportunity</p>
                      <p className="text-sm mt-1">Premium segment growing 23% faster than economy</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="font-medium text-purple-700">📍 Regional</p>
                      <p className="text-sm mt-1">Colombo: 71% premium food share vs Jaffna: 23%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthGuard>
  )
}