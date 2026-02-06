"use client"

import { useState } from "react"
import { SearchFiltersComponent } from "@/components/search-filters"
import { SearchResults } from "@/components/search-results"
import { ProtectedRoute } from "@/components/ProtectedRoute"

interface SearchFilters {
  query: string
  department: string
  username: string
  streetName: string
  area: string
  city: string
  state: string
  country: string
  dateFrom: string
  dateTo: string
  mediaType: string
  sortBy: string
}

export default function SearchPage() {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    department: "",
    username: "",
    streetName: "",
    area: "",
    city: "",
    state: "",
    country: "",
    dateFrom: "",
    dateTo: "",
    mediaType: "",
    sortBy: "recent",
  })

  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = () => {
    console.log("Searching with filters:", filters)
    setHasSearched(true)
  }

  return (
    <ProtectedRoute>
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
    </ProtectedRoute>
  )
}
