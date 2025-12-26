"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ChevronDown, X } from "lucide-react"

interface SearchFilters {
  department: string
  ministry: string
  username: string
  streetName: string
  areaName: string
  locationName: string
  city: string
  state: string
  country: string
  corporateName: string
  pinCode: string
  dateRangeStart: string
  dateRangeEnd: string
}

interface SearchFiltersProps {
  filters: SearchFilters
  onFilterChange: (filters: SearchFilters) => void
  onSearch: () => void
}

export function SearchFiltersComponent({ filters, onFilterChange, onSearch }: SearchFiltersProps) {
  const [expanded, setExpanded] = useState(true)

  const handleInputChange = (field: keyof SearchFilters, value: string) => {
    onFilterChange({ ...filters, [field]: value })
  }

  const handleReset = () => {
    onFilterChange({
      department: "",
      ministry: "",
      username: "",
      streetName: "",
      areaName: "",
      locationName: "",
      city: "",
      state: "",
      country: "",
      corporateName: "",
      pinCode: "",
      dateRangeStart: "",
      dateRangeEnd: "",
    })
  }

  const activeFilters = Object.values(filters).filter((v) => v !== "").length

  return (
    <Card>
      <CardHeader className="cursor-pointer hover:bg-muted transition-colors" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Advanced Filters</CardTitle>
          <div className="flex items-center gap-2">
            {activeFilters > 0 && (
              <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-sm font-medium">
                {activeFilters}
              </span>
            )}
            <ChevronDown className={`w-5 h-5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          <Accordion type="single" collapsible className="w-full">
            {/* Organization Filters */}
            <AccordionItem value="organization">
              <AccordionTrigger>Organization & Department</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div>
                  <Label htmlFor="department" className="text-sm">
                    Department
                  </Label>
                  <Select value={filters.department} onValueChange={(v) => handleInputChange("department", v)}>
                    <SelectTrigger id="department">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eb">EB (Electricity Board)</SelectItem>
                      <SelectItem value="nh">NH (National Highways)</SelectItem>
                      <SelectItem value="telecom">Telecom</SelectItem>
                      <SelectItem value="hr">Human Resources</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ministry" className="text-sm">
                    Ministry / Secretariat
                  </Label>
                  <Input
                    id="ministry"
                    placeholder="e.g., Ministry of Education"
                    value={filters.ministry}
                    onChange={(e) => handleInputChange("ministry", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="corporate" className="text-sm">
                    Corporate Name
                  </Label>
                  <Input
                    id="corporate"
                    placeholder="e.g., TCS, Infosys"
                    value={filters.corporateName}
                    onChange={(e) => handleInputChange("corporateName", e.target.value)}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Location Filters */}
            <AccordionItem value="location">
              <AccordionTrigger>Location Details</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div>
                  <Label htmlFor="country" className="text-sm">
                    Country
                  </Label>
                  <Input
                    id="country"
                    placeholder="e.g., India"
                    value={filters.country}
                    onChange={(e) => handleInputChange("country", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="state" className="text-sm">
                    State / Province
                  </Label>
                  <Input
                    id="state"
                    placeholder="e.g., Tamil Nadu"
                    value={filters.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="city" className="text-sm">
                    City / District
                  </Label>
                  <Input
                    id="city"
                    placeholder="e.g., Chennai"
                    value={filters.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="area" className="text-sm">
                    Area Name
                  </Label>
                  <Input
                    id="area"
                    placeholder="e.g., Mylapore"
                    value={filters.areaName}
                    onChange={(e) => handleInputChange("areaName", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="street" className="text-sm">
                    Street Name
                  </Label>
                  <Input
                    id="street"
                    placeholder="e.g., Marina Beach Road"
                    value={filters.streetName}
                    onChange={(e) => handleInputChange("streetName", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="pincode" className="text-sm">
                    Pin Code
                  </Label>
                  <Input
                    id="pincode"
                    placeholder="e.g., 600004"
                    value={filters.pinCode}
                    onChange={(e) => handleInputChange("pinCode", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="location-name" className="text-sm">
                    Location Name
                  </Label>
                  <Input
                    id="location-name"
                    placeholder="e.g., Marina Beach, Fort Museum"
                    value={filters.locationName}
                    onChange={(e) => handleInputChange("locationName", e.target.value)}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* User & Date Filters */}
            <AccordionItem value="user-date">
              <AccordionTrigger>User & Date Range</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div>
                  <Label htmlFor="username" className="text-sm">
                    Username
                  </Label>
                  <Input
                    id="username"
                    placeholder="e.g., @johndoe"
                    value={filters.username}
                    onChange={(e) => handleInputChange("username", e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm">Date Range</Label>
                  <div>
                    <label className="text-xs text-muted-foreground">From</label>
                    <Input
                      type="date"
                      value={filters.dateRangeStart}
                      onChange={(e) => handleInputChange("dateRangeStart", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">To</label>
                    <Input
                      type="date"
                      value={filters.dateRangeEnd}
                      onChange={(e) => handleInputChange("dateRangeEnd", e.target.value)}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button onClick={onSearch} className="flex-1">
              Search
            </Button>
            {activeFilters > 0 && (
              <Button variant="outline" className="bg-transparent" onClick={handleReset}>
                <X className="w-4 h-4 mr-2" />
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
