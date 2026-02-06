"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { authApi } from "@/lib/api"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [name, setName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [mobileNumber, setMobileNumber] = useState(user?.mobile || "")
  const [isLoading, setIsLoading] = useState(false)

  const handleUpdateProfile = async () => {
    setIsLoading(true)
    try {
      const response = await authApi.updateProfile({ name, email, mobileNumber })
      if (response.success) {
        toast.success("Profile updated successfully")
      } else {
        toast.error(response.message || "Failed to update profile")
      }
    } catch (error) {
      toast.error("Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        <div className="space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={user?.username || ""} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground mt-1">Username cannot be changed</p>
              </div>
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input
                  id="mobile"
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="Enter your mobile number"
                />
              </div>
              <Button onClick={handleUpdateProfile} disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Profile"}
              </Button>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
              <CardDescription>Manage your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Logout</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Sign out of your account on this device
                </p>
                <Button variant="outline" onClick={logout}>
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Customize your experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Notification preferences can be configured here (coming soon)
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Privacy</h3>
                <p className="text-sm text-muted-foreground">
                  Privacy settings will be available soon
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
