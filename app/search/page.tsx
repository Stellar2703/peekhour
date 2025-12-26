"use client"

import { useState } from "react"
import { SearchFiltersComponent } from "@/components/search-filters"
import { SearchResults } from "@/components/search-results"

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

export default function SearchPage() {
  const [filters, setFilters] = useState<SearchFilters>({
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

  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = () => {
    console.log("Searching with filters:", filters)
    setHasSearched(true)
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Search Events & Content</h1>
            <p className="text-muted-foreground">
              Find posts, photos, videos, and audio by location, department, date, and more
            </p>
          </div>

          <SearchFiltersComponent filters={filters} onFilterChange={setFilters} onSearch={handleSearch} />

          <SearchResults filters={filters} hasSearched={hasSearched} />
        </div>
      </div>
    </main>
  )
}
