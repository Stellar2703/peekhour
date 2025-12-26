"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CreateDepartmentDialogProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (data: CreateDepartmentData) => void
}

export interface CreateDepartmentData {
  name: string
  type: "college" | "government" | "corporate" | "community"
  description: string
  location?: string
}

export function CreateDepartmentDialog({ isOpen, onClose, onCreate }: CreateDepartmentDialogProps) {
  const [formData, setFormData] = useState<CreateDepartmentData>({
    name: "",
    type: "college",
    description: "",
    location: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Department name is required"
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onCreate(formData)
    setFormData({ name: "", type: "college", description: "", location: "" })
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Department / Page</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dept-name">Department / Page Name</Label>
            <Input
              id="dept-name"
              placeholder="e.g., CSE Department, Police Station"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            {errors.name && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-3 w-3" />
                <AlertDescription className="text-xs">{errors.name}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dept-type">Type</Label>
            <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as any })}>
              <SelectTrigger id="dept-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="college">College Department</SelectItem>
                <SelectItem value="government">Government Department</SelectItem>
                <SelectItem value="corporate">Corporate Organization</SelectItem>
                <SelectItem value="community">Community Group</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dept-desc">Description</Label>
            <textarea
              id="dept-desc"
              placeholder="Describe the purpose of this department or page..."
              className="w-full p-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            {errors.description && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-3 w-3" />
                <AlertDescription className="text-xs">{errors.description}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dept-location">Location (Optional)</Label>
            <Input
              id="dept-location"
              placeholder="e.g., Chennai, TamilNadu"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" className="bg-transparent" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create Department</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
