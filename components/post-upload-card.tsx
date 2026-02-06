"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageIcon, Video, Volume2, MapPin, X } from "lucide-react"
import { postsApi, userApi, departmentsApi } from "@/lib/api"
import { toast } from "sonner"

interface PostUploadCardProps {
  defaultDepartmentId?: string
}

export function PostUploadCard({ defaultDepartmentId }: PostUploadCardProps = {}) {
  const [content, setContent] = useState("")
  const [mediaType, setMediaType] = useState<"photo" | "video" | "audio" | null>(null)
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [location, setLocation] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [country, setCountry] = useState("India")
  const [selectedDepartment, setSelectedDepartment] = useState(defaultDepartmentId || "")
  const [isPosting, setIsPosting] = useState(false)
  const [previousLocations, setPreviousLocations] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load previous locations and departments
  useEffect(() => {
    loadPreviousLocations()
    loadDepartments()
  }, [])

  // Set default department when prop changes
  useEffect(() => {
    if (defaultDepartmentId) {
      setSelectedDepartment(defaultDepartmentId)
    }
  }, [defaultDepartmentId])

  const loadPreviousLocations = async () => {
    try {
      const response = await userApi.getLocations()
      if (response.success && response.data) {
        setPreviousLocations(Array.isArray(response.data) ? response.data : [])
      }
    } catch (error) {
      console.error("Failed to load locations:", error)
    }
  }

  const loadDepartments = async () => {
    try {
      const response = await departmentsApi.getAll()
      if (response.success && response.data) {
        setDepartments(Array.isArray(response.data) ? response.data : [])
      }
    } catch (error) {
      console.error("Failed to load departments:", error)
    }
  }

  const handleMediaSelect = (type: "photo" | "video" | "audio") => {
    setMediaType(type)
    setTimeout(() => {
      fileInputRef.current?.click()
    }, 100)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setMediaFile(file)
      toast.success(`${mediaType} selected: ${file.name}`)
    }
  }

  const handlePost = async () => {
    if (!content && !mediaFile) {
      toast.error("Please add some content or media")
      return
    }

    if (!city || !state) {
      toast.error("Please provide at least city and state")
      return
    }

    setIsPosting(true)

    try {
      const formData = new FormData()
      
      if (content) {
        formData.append("content", content)
      }
      
      if (mediaFile && mediaType) {
        formData.append("media", mediaFile)
        formData.append("mediaType", mediaType)
      }
      
      formData.append("location", location)
      formData.append("city", city)
      formData.append("state", state)
      formData.append("country", country)
      
      if (selectedDepartment) {
        formData.append("departmentId", selectedDepartment)
      }

      const response = await postsApi.create(formData)

      if (response.success) {
        toast.success("Post created successfully!")
        // Reset form
        setContent("")
        setMediaFile(null)
        setMediaType(null)
        setLocation("")
        setCity("")
        setState("")
        setCountry("India")
        setSelectedDepartment(defaultDepartmentId || "")
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        // Refresh page to show new post
        window.location.reload()
      } else {
        toast.error(response.message || "Failed to create post")
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred")
    } finally {
      setIsPosting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Post</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Text Content */}
        <div>
          <Textarea
            placeholder="What's happening at your location?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Media Upload */}
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={
              mediaType === "photo" ? "image/*" :
              mediaType === "video" ? "video/*" :
              mediaType === "audio" ? "audio/*" : ""
            }
            onChange={handleFileChange}
            className="hidden"
          />
          
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={mediaType === "photo" ? "default" : "outline"}
              onClick={() => handleMediaSelect("photo")}
              type="button"
              className="gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              Photo
            </Button>
            <Button
              variant={mediaType === "video" ? "default" : "outline"}
              onClick={() => handleMediaSelect("video")}
              type="button"
              className="gap-2"
            >
              <Video className="w-4 h-4" />
              Video
            </Button>
            <Button
              variant={mediaType === "audio" ? "default" : "outline"}
              onClick={() => handleMediaSelect("audio")}
              type="button"
              className="gap-2"
            >
              <Volume2 className="w-4 h-4" />
              Audio
            </Button>
          </div>

          {mediaFile && (
            <div className="flex items-center justify-between p-2 bg-muted rounded">
              <span className="text-sm truncate">{mediaFile.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMediaFile(null)
                  setMediaType(null)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ""
                  }
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Location
          </Label>
          
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="City *"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <Input
              placeholder="State *"
              value={state}
              onChange={(e) => setState(e.target.value)}
            />
          </div>
          
          <Input
            placeholder="Specific location (optional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          {previousLocations.length > 0 && (
            <div className="text-xs text-muted-foreground">
              Previous: {previousLocations.slice(0, 3).map(loc => `${loc.city}, ${loc.state}`).join(" • ")}
            </div>
          )}
        </div>

        {/* Department Selection */}
        {departments.length > 0 && (
          <div>
            <Label>Department (Optional)</Label>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept: any) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Post Button */}
        <Button
          className="w-full"
          onClick={handlePost}
          disabled={isPosting}
        >
          {isPosting ? "Posting..." : "Post"}
        </Button>
      </CardContent>
    </Card>
  )
}
