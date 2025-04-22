"use client"

import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useDebounce } from '@/hooks/useDebounce'

interface ClientSearchProps {
  onSearch: (query: string) => void
}

export function ClientSearch({ onSearch }: ClientSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedQuery = useDebounce(searchQuery, 300)

  // Gọi onSearch khi debouncedQuery thay đổi
  React.useEffect(() => {
    onSearch(debouncedQuery)
  }, [debouncedQuery, onSearch])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="relative flex-1">
        <span className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500"><Search /></span>
        <Input
          type="text"
          placeholder="Tìm kiếm khách hàng..."
          value={searchQuery}
          onChange={handleChange}
          className="pl-9"
        />
      </div>
    </div>
  )
}
