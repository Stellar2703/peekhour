"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Eye, EyeOff, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function SignupForm() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    mobileNumber: "",
    password: "",
    confirmPassword: "",
  })

  const [cameraActive, setCameraActive] = useState(false)
  const [faceCaptured, setFaceCaptured] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError("")
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraActive(true)
      }
    } catch (err) {
      setError("Unable to access camera. Please check permissions.")
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d")
      if (context) {
        context.drawImage(videoRef.current, 0, 0)
        setFaceCaptured(true)
        stopCamera()
      }
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      setCameraActive(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!faceCaptured) {
      setError("Face capture is mandatory. Please take a photo.")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    // Mock signup - in real app, this would call API
    console.log("Signup attempt:", formData)
    router.push("/home")
  }

  return (
    <div className="w-full max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>Join Peekhour to share and discover location-based events</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Face Capture Section */}
            <div className="space-y-2">
              <Label>Face Capture (Required)</Label>
              {!faceCaptured ? (
                <div className="space-y-2">
                  {cameraActive ? (
                    <div className="space-y-2">
                      <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg bg-muted" />
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={stopCamera}>
                          Cancel
                        </Button>
                        <Button type="button" className="flex-1 gap-2" onClick={capturePhoto}>
                          <Camera className="w-4 h-4" />
                          Capture
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2 bg-transparent"
                      onClick={startCamera}
                    >
                      <Camera className="w-4 h-4" />
                      Start Camera
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <canvas ref={canvasRef} className="hidden" width="640" height="480" />
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm text-muted-foreground mb-2">Face captured successfully</p>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={() => setFaceCaptured(false)}
                    >
                      Retake Photo
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                placeholder="johndoe"
                value={formData.username}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email ID</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobileNumber">Mobile Number</Label>
              <Input
                id="mobileNumber"
                name="mobileNumber"
                placeholder="+1 234 567 8900"
                value={formData.mobileNumber}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full">
              Create Account
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Button variant="link" className="p-0 h-auto" asChild>
                <a href="/login">Login</a>
              </Button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
