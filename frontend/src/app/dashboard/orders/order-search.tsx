"use client"

import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Search from "lucide-react/dist/esm/icons/search"
import { useDebounce } from '@/hooks/useDebounce'

interface OrderSearchProps {
  onSearch: (query: string) => void
}

export function OrderSearch({ onSearch }: OrderSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedQuery = useDebounce(searchQuery, 300)

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
          placeholder="Tìm kiếm mã đơn hàng..."
          value={searchQuery}
          onChange={handleChange}
          className="pl-9"
        />
      </div>
    </div>
  )
}
