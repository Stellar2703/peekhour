"use client"

import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-background via-background to-secondary/10">
      <LoginForm />
    </main>
  )
}
