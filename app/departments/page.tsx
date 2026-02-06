"use client"

import { DepartmentsList } from "@/components/departments-list"
import { ProtectedRoute } from "@/components/ProtectedRoute"

export default function DepartmentsPage() {
  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <DepartmentsList />
        </div>
      </main>
    </ProtectedRoute>
  )
}
