"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

interface OrderSearchProps {
  onSearch: (query: string) => void
}

export function OrderSearch({ onSearch }: OrderSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchQuery)
  }

  return (
    <form onSubmit={handleSearch} className="flex items-center space-x-2">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          type="text"
          placeholder="Tìm kiếm mã đơn hàng..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onSearch(searchQuery)
            }
          }}
        />
      </div>
      <Button type="submit" variant="default" size="sm" className="whitespace-nowrap">
        Tìm kiếm
      </Button>
    </form>
  )
}
