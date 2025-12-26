import { DepartmentsList } from "@/components/departments-list"

export default function DepartmentsPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <DepartmentsList />
      </div>
    </main>
  )
}
