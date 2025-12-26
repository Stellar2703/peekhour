"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DepartmentCard } from "@/components/department-card"
import { CreateDepartmentDialog, type CreateDepartmentData } from "@/components/create-department-dialog"
import { Search, Plus } from "lucide-react"

interface Department {
  id: string
  name: string
  type: "college" | "government" | "corporate" | "community"
  description: string
  members: number
  posts: number
  avatar: string
  location?: string
  isJoined: boolean
}

const mockDepartments: Department[] = [
  {
    id: "1",
    name: "CSE Department",
    type: "college",
    description:
      "Computer Science and Engineering Department for sharing academic updates, project discussions, and college events.",
    members: 284,
    posts: 156,
    avatar: "🎓",
    location: "Anna University, Chennai",
    isJoined: true,
  },
  {
    id: "2",
    name: "Chennai Police Department",
    type: "government",
    description: "Official channel for police department announcements, public safety alerts, and community programs.",
    members: 1200,
    posts: 89,
    avatar: "🚔",
    location: "Chennai, Tamil Nadu",
    isJoined: false,
  },
  {
    id: "3",
    name: "TCS Technology Hub",
    type: "corporate",
    description:
      "Tata Consultancy Services innovation center for tech discussions, webinars, and career opportunities.",
    members: 2500,
    posts: 234,
    avatar: "💻",
    location: "Bangalore, Karnataka",
    isJoined: false,
  },
  {
    id: "4",
    name: "Mylapore Community",
    type: "community",
    description: "Local community page for neighborhood events, announcements, and community collaboration.",
    members: 456,
    posts: 123,
    avatar: "👥",
    location: "Mylapore, Chennai",
    isJoined: true,
  },
  {
    id: "5",
    name: "Inter-College Events",
    type: "college",
    description: "Platform for organizing and promoting inter-college competitions, cultural events, and festivals.",
    members: 892,
    posts: 234,
    avatar: "🎉",
    location: "Tamil Nadu",
    isJoined: false,
  },
]

export function DepartmentsList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string | null>(null)
  const [departments, setDepartments] = useState(mockDepartments)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const handleCreateDepartment = (data: CreateDepartmentData) => {
    const newDept: Department = {
      id: (departments.length + 1).toString(),
      ...data,
      members: 1,
      posts: 0,
      avatar: "🆕",
      isJoined: true,
    }
    setDepartments([newDept, ...departments])
  }

  const handleJoinDepartment = (id: string) => {
    setDepartments(departments.map((dept) => (dept.id === id ? { ...dept, isJoined: true } : dept)))
  }

  const filteredDepartments = departments.filter((dept) => {
    const matchesSearch = dept.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = !filterType || dept.type === filterType
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Departments & Pages</h1>
        <p className="text-muted-foreground">
          Browse departments, join communities, or create your own page to share local content
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Department
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={!filterType ? "default" : "outline"}
          className={!filterType ? "" : "bg-transparent"}
          onClick={() => setFilterType(null)}
          size="sm"
        >
          All
        </Button>
        <Button
          variant={filterType === "college" ? "default" : "outline"}
          className={filterType === "college" ? "" : "bg-transparent"}
          onClick={() => setFilterType("college")}
          size="sm"
        >
          College
        </Button>
        <Button
          variant={filterType === "government" ? "default" : "outline"}
          className={filterType === "government" ? "" : "bg-transparent"}
          onClick={() => setFilterType("government")}
          size="sm"
        >
          Government
        </Button>
        <Button
          variant={filterType === "corporate" ? "default" : "outline"}
          className={filterType === "corporate" ? "" : "bg-transparent"}
          onClick={() => setFilterType("corporate")}
          size="sm"
        >
          Corporate
        </Button>
        <Button
          variant={filterType === "community" ? "default" : "outline"}
          className={filterType === "community" ? "" : "bg-transparent"}
          onClick={() => setFilterType("community")}
          size="sm"
        >
          Community
        </Button>
      </div>

      {/* Departments Grid */}
      {filteredDepartments.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDepartments.map((dept) => (
            <DepartmentCard key={dept.id} department={dept} onJoin={handleJoinDepartment} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No departments found matching your criteria</p>
          <Button onClick={() => setShowCreateDialog(true)} variant="outline" className="bg-transparent">
            Create a new department
          </Button>
        </div>
      )}

      {/* Create Department Dialog */}
      <CreateDepartmentDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreate={handleCreateDepartment}
      />
    </div>
  )
}
