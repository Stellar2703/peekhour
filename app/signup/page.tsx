"use client"

import { SignupForm } from "@/components/auth/signup-form"

export default function SignupPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-background via-background to-secondary/10">
      <SignupForm />
    </main>
  )
}
