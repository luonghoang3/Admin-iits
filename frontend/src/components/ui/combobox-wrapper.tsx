"use client"

import * as React from "react"
import { Combobox, ComboboxItem } from "./combobox"

interface ComboboxWrapperProps {
  options?: { label: string; value: string }[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  isLoading?: boolean
  onInputChange?: (query: string) => void
  emptyMessage?: React.ReactNode
  className?: string
  // Thêm props cho lazy loading
  hasMore?: boolean
  onLoadMore?: () => void
  isLoadingMore?: boolean
  // Thêm props cho selected item
  selectedItemData?: {
    value: string
    label: string
    description?: string
  } | null
}

export function HeadlessuiCombobox({
  options = [],
  value = '',
  onChange,
  placeholder = "Select an option",
  disabled = false,
  isLoading = false,
  onInputChange,
  emptyMessage,
  className,
  // Thêm props mới
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
  // Thêm selectedItemData
  selectedItemData
}: ComboboxWrapperProps) {
  // Convert options to items format
  const items: ComboboxItem[] = options.map(option => ({
    label: option.label,
    value: option.value
  }))

  return (
    <Combobox
      items={items}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      loading={isLoading}
      onSearch={onInputChange}
      emptyContent={emptyMessage}
      className={className}
      // Truyền props mới
      hasMore={hasMore}
      onLoadMore={onLoadMore}
      isLoadingMore={isLoadingMore}
      // Truyền selectedItemData
      selectedItemData={selectedItemData}
    />
  )
}
