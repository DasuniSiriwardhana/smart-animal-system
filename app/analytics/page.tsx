// app/analytics/page.tsx
"use client"

import { useState } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Activity, Calendar, Heart, Moon } from "lucide-react"

// Mock data
const activityData = [
  { day: "Mon", minutes: 45 },
  { day: "Tue", minutes: 30 },
  { day: "Wed", minutes: 60 },
  { day: "Thu", minutes: 25 },
  { day: "Fri", minutes: 50 },
  { day: "Sat", minutes: 75 },
  { day: "Sun", minutes: 40 },
]

const moodData = [
  { name: "Happy", value: 45 },
  { name: "Calm", value: 25 },
  { name: "Playful", value: 15 },
  { name: "Tired", value: 10 },
  { name: "Anxious", value: 5 },
]

const sleepData = [
  { day: "Mon", hours: 8 },
  { day: "Tue", hours: 7.5 },
  { day: "Wed", hours: 9 },
  { day: "Thu", hours: 6.5 },
  { day: "Fri", hours: 8 },
  { day: "Sat", hours: 8.5 },
  { day: "Sun", hours: 9.5 },
]

const COLORS = ["#f59e0b", "#10b981", "#8b5cf6", "#3b82f6", "#ef4444"]

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track your pet&apos;s health trends over time</p>
        </div>

        <Tabs defaultValue="activity" className="space-y-4">
          <TabsList>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="mood">Mood</TabsTrigger>
            <TabsTrigger value="sleep">Sleep</TabsTrigger>
            <TabsTrigger value="health">Health Score</TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Weekly Activity
                </CardTitle>
                <CardDescription>Daily exercise duration in minutes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="minutes" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mood">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Mood Distribution
                </CardTitle>
                <CardDescription>Breakdown of emotional states</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={moodData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                        >
                        {moodData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                        </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sleep">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Moon className="h-5 w-5 text-blue-500" />
                  Sleep Pattern
                </CardTitle>
                <CardDescription>Hours of sleep per day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sleepData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="health">
            <Card>
              <CardHeader>
                <CardTitle>Health Score Trend</CardTitle>
                <CardDescription>Overall wellness score over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full flex items-center justify-center">
                  <p className="text-muted-foreground">Health score chart coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}



