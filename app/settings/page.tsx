"use client";

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Bell, 
  Moon, 
  Sun, 
  Shield, 
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Mail
} from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

interface NotificationSettings {
  email: boolean
  push: boolean
  health: boolean
  reminders: boolean
  marketing: boolean
}

// Default settings
const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  email: true,
  push: false,
  health: true,
  reminders: true,
  marketing: false,
}

const DEFAULT_THEME = "light"

export default function SettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [theme, setTheme] = useState<"light" | "dark">(DEFAULT_THEME)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [notifications, setNotifications] = useState<NotificationSettings>(DEFAULT_NOTIFICATIONS)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    loadUserPreferences()
  }, [user, router])

  const loadUserPreferences = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle()

      if (error) {
        console.error("Error loading preferences:", error)
        // Use defaults if error
        applyDefaultPreferences()
        setLoading(false)
        return
      }

      if (data) {
        // Load saved preferences
        setNotifications({
          email: data.email_notifications ?? DEFAULT_NOTIFICATIONS.email,
          push: data.push_notifications ?? DEFAULT_NOTIFICATIONS.push,
          health: data.health_alerts ?? DEFAULT_NOTIFICATIONS.health,
          reminders: data.daily_reminders ?? DEFAULT_NOTIFICATIONS.reminders,
          marketing: data.marketing_emails ?? DEFAULT_NOTIFICATIONS.marketing,
        })
        setTheme(data.theme ?? DEFAULT_THEME)
        
        // Apply theme
        if (data.theme === "dark") {
          document.documentElement.classList.add("dark")
        } else {
          document.documentElement.classList.remove("dark")
        }
      } else {
        // No preferences found, use defaults
        applyDefaultPreferences()
        
        // Create default preferences in database
        await createDefaultPreferences()
      }
    } catch (error) {
      console.error("Error loading preferences:", error)
      applyDefaultPreferences()
    } finally {
      setLoading(false)
    }
  }

  const applyDefaultPreferences = () => {
    setNotifications(DEFAULT_NOTIFICATIONS)
    setTheme(DEFAULT_THEME)
    document.documentElement.classList.remove("dark")
  }

  const createDefaultPreferences = async () => {
    try {
      await supabase.from("user_preferences").insert({
        user_id: user?.id,
        email_notifications: DEFAULT_NOTIFICATIONS.email,
        push_notifications: DEFAULT_NOTIFICATIONS.push,
        health_alerts: DEFAULT_NOTIFICATIONS.health,
        daily_reminders: DEFAULT_NOTIFICATIONS.reminders,
        marketing_emails: DEFAULT_NOTIFICATIONS.marketing,
        theme: DEFAULT_THEME,
      })
      console.log("Default preferences created")
    } catch (error) {
      console.error("Error creating default preferences:", error)
    }
  }

  const savePreferences = async () => {
    if (!user) return
    
    setSaving(true)
    setSaveSuccess(false)
    setSaveError(null)

    try {
      const { error } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          email_notifications: notifications.email,
          push_notifications: notifications.push,
          health_alerts: notifications.health,
          daily_reminders: notifications.reminders,
          marketing_emails: notifications.marketing,
          theme: theme,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

      if (error) throw error

      // Apply theme immediately
      if (theme === "dark") {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error("Error saving preferences:", error)
      setSaveError("Failed to save preferences. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const requestPasswordChange = async () => {
    if (!user?.email) {
      setSaveError("No email associated with your account")
      return
    }

    setSendingEmail(true)
    setEmailSent(false)
    setSaveError(null)

    try {
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 1)

      await supabase.from("password_reset_requests").insert({
        user_id: user.id,
        token: token,
        expires_at: expiresAt.toISOString(),
        used: false
      })

      const resetLink = `${window.location.origin}/verify-password?token=${token}`
      
      const response = await fetch('/api/auth/send-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: user.email,
          resetLink: resetLink,
          name: user.name || user.email?.split('@')[0]
        }),
      })
      
      if (response.ok) {
        setEmailSent(true)
        setTimeout(() => setEmailSent(false), 5000)
      } else {
        const data = await response.json()
        setSaveError(data.error || "Failed to send verification email")
      }
    } catch (error) {
      console.error("Error requesting password change:", error)
      setSaveError("Failed to send verification email")
    } finally {
      setSendingEmail(false)
    }
  }

  const handleNotificationChange = (key: keyof NotificationSettings) => (checked: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: checked }))
  }

  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme)
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  if (!user) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your account preferences</p>
          </div>

          {saveSuccess && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                Settings saved successfully!
              </AlertDescription>
            </Alert>
          )}

          {saveError && (
            <Alert className="mb-6 bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-600">
                {saveError}
              </AlertDescription>
            </Alert>
          )}

          {emailSent && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <Mail className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                Password reset email sent! Please check your inbox.
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="notifications" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>Choose how you want to receive updates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive updates via email</p>
                    </div>
                    <Switch 
                      checked={notifications.email}
                      onCheckedChange={handleNotificationChange('email')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive browser notifications</p>
                    </div>
                    <Switch 
                      checked={notifications.push}
                      onCheckedChange={handleNotificationChange('push')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Health Alerts</p>
                      <p className="text-sm text-muted-foreground">Get notified about health concerns</p>
                    </div>
                    <Switch 
                      checked={notifications.health}
                      onCheckedChange={handleNotificationChange('health')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Daily Reminders</p>
                      <p className="text-sm text-muted-foreground">Reminders to log daily activities</p>
                    </div>
                    <Switch 
                      checked={notifications.reminders}
                      onCheckedChange={handleNotificationChange('reminders')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Marketing Emails</p>
                      <p className="text-sm text-muted-foreground">Receive product updates and offers</p>
                    </div>
                    <Switch 
                      checked={notifications.marketing}
                      onCheckedChange={handleNotificationChange('marketing')}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sun className="h-5 w-5" />
                    Appearance
                  </CardTitle>
                  <CardDescription>Customize how the app looks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      <div>
                        <p className="font-medium">Light Mode</p>
                        <p className="text-sm text-muted-foreground">Use light theme</p>
                      </div>
                    </div>
                    <Button 
                      variant={theme === "light" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => handleThemeChange("light")}
                    >
                      {theme === "light" ? "Active" : "Switch"}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      <div>
                        <p className="font-medium">Dark Mode</p>
                        <p className="text-sm text-muted-foreground">Use dark theme</p>
                      </div>
                    </div>
                    <Button 
                      variant={theme === "dark" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => handleThemeChange("dark")}
                    >
                      {theme === "dark" ? "Active" : "Switch"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>Manage your password and security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800 mb-3">
                      To change your password, we&apos;ll send a verification link to your email address.
                    </p>
                    <Button 
                      onClick={requestPasswordChange}
                      disabled={sendingEmail}
                      variant="outline"
                      className="w-full"
                    >
                      {sendingEmail ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                      {sendingEmail ? "Sending..." : "Send Reset Email"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end mt-6">
            <Button onClick={savePreferences} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}