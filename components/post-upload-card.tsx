"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageIcon, Video, Volume2, MapPin, Calendar, Users, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface LocationData {
  country: string
  state: string
  city: string
  area: string
  street: string
  pinCode: string
}

export function PostUploadCard() {
  const [mediaType, setMediaType] = useState<"photo" | "video" | "audio" | null>(null)
  const [textContent, setTextContent] = useState("")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [selectedDepartment, setSelectedDepartment] = useState("")
  const [locationData, setLocationData] = useState<LocationData>({
    country: "India",
    state: "Tamil Nadu",
    city: "Chennai",
    area: "",
    street: "",
    pinCode: "",
  })
  const [autoDetectLocation, setAutoDetectLocation] = useState(false)
  const [previousLocations] = useState<LocationData[]>([
    { country: "India", state: "Tamil Nadu", city: "Chennai", area: "Mylapore", street: "Mylapore", pinCode: "600004" },
    {
      country: "India",
      state: "Karnataka",
      city: "Bangalore",
      area: "Indiranagar",
      street: "Indiranagar",
      pinCode: "560038",
    },
  ])

  const handleLocationChange = (field: keyof LocationData, value: string) => {
    setLocationData((prev) => ({ ...prev, [field]: value }))
  }

  const applyPreviousLocation = (location: LocationData) => {
    setLocationData(location)
  }

  const handlePost = () => {
    if (!mediaType && !textContent) {
      alert("Please add content or select a media type")
      return
    }

    console.log({
      mediaType,
      textContent,
      date: selectedDate,
      department: selectedDepartment,
      location: locationData,
    })

    // Reset form
    setMediaType(null)
    setTextContent("")
    setSelectedDepartment("")
  }

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Text Content */}
          <div>
            <Label htmlFor="post-text" className="text-sm font-medium">
              What&apos;s happening?
            </Label>
            <textarea
              id="post-text"
              className="w-full mt-2 p-3 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary bg-input"
              rows={3}
              placeholder="Share what you're seeing or experiencing..."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
            />
          </div>

          {/* Media Selection */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Upload Media</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={mediaType === "photo" ? "default" : "outline"}
                className="gap-2 bg-transparent"
                onClick={() => setMediaType("photo")}
              >
                <ImageIcon className="w-4 h-4" />
                Photo
              </Button>
              <Button
                variant={mediaType === "video" ? "default" : "outline"}
                className="gap-2 bg-transparent"
                onClick={() => setMediaType("video")}
              >
                <Video className="w-4 h-4" />
                Video
              </Button>
              <Button
                variant={mediaType === "audio" ? "default" : "outline"}
                className="gap-2 bg-transparent"
                onClick={() => setMediaType("audio")}
              >
                <Volume2 className="w-4 h-4" />
                Audio
              </Button>
            </div>
            {mediaType && (
              <div className="mt-3 p-3 bg-muted rounded-lg flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {mediaType === "photo" && "Select image file"}
                  {mediaType === "video" && "Select video file"}
                  {mediaType === "audio" && "Select audio file"}
                </span>
                <Button variant="ghost" size="sm" onClick={() => setMediaType(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Date Selection */}
          <div>
            <Label htmlFor="post-date" className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date
            </Label>
            <Input
              id="post-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="mt-2"
            />
          </div>

          {/* Location Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location Details
            </Label>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="auto-detect"
                checked={autoDetectLocation}
                onChange={(e) => setAutoDetectLocation(e.target.checked)}
              />
              <label htmlFor="auto-detect" className="text-sm cursor-pointer">
                Auto-detect location
              </label>
            </div>

            {autoDetectLocation && (
              <Alert>
                <AlertDescription>Location auto-detection enabled. Using device location.</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Country</Label>
                <Input
                  value={locationData.country}
                  onChange={(e) => handleLocationChange("country", e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">State</Label>
                <Input
                  value={locationData.state}
                  onChange={(e) => handleLocationChange("state", e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">City</Label>
                <Input
                  value={locationData.city}
                  onChange={(e) => handleLocationChange("city", e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Area</Label>
                <Input
                  value={locationData.area}
                  onChange={(e) => handleLocationChange("area", e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Street</Label>
                <Input
                  value={locationData.street}
                  onChange={(e) => handleLocationChange("street", e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Pin Code</Label>
                <Input
                  value={locationData.pinCode}
                  onChange={(e) => handleLocationChange("pinCode", e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Previous Locations */}
            {previousLocations.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Recently Used Locations</Label>
                <div className="space-y-2">
                  {previousLocations.map((location, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className="w-full justify-start text-left bg-transparent h-auto py-2"
                      onClick={() => applyPreviousLocation(location)}
                    >
                      <span className="text-sm">
                        {location.area || location.city}, {location.state}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Department Selection */}
          <div>
            <Label htmlFor="department" className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Department / Page
            </Label>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger id="department" className="mt-2">
                <SelectValue placeholder="Select a department or create new" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cse-dept">CSE Department</SelectItem>
                <SelectItem value="college-events">College Events</SelectItem>
                <SelectItem value="police-dept">Police Department</SelectItem>
                <SelectItem value="city-events">City Events</SelectItem>
                <SelectItem value="create-new">+ Create New Department</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Post Button */}
          <Button className="w-full" onClick={handlePost} size="lg">
            Post to Peekhour
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
