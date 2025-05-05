"use client"

import * as React from "react"
import { Fragment, useRef, useCallback } from "react"
import { Combobox as HeadlessUICombobox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid"
import { cn } from "@/lib/utils"

export interface ComboboxItem {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

interface ComboboxProps {
  items: ComboboxItem[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string // Kept for potential future use, but input handles placeholder now
  disabled?: boolean
  loading?: boolean
  searchValue?: string // Will be controlled internally by HeadlessUICombobox.Input
  onSearch?: (query: string) => void // Use HeadlessUICombobox onChange for input changes
  emptyContent?: React.ReactNode
  loadingContent?: React.ReactNode
  showSelected?: boolean
  className?: string
  // New props for infinite scroll
  onLoadMore?: () => void
  hasMore?: boolean
  isLoadingMore?: boolean
  // New prop to pass the full selected item object
  selectedItemData?: ComboboxItem | null
}

export function Combobox({
  items,
  value = '',
  onChange,
  placeholder = "Select an option",
  searchPlaceholder = "Search...", // Assign to input placeholder
  disabled = false,
  loading = false,
  // searchValue prop is removed as it's handled internally
  onSearch, // onSearch prop is removed as onChange handles input changes
  emptyContent,
  loadingContent,
  showSelected = false,
  className,
  // Destructure new props
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  // Destructure new prop
  selectedItemData = null
}: ComboboxProps) {
  const [query, setQuery] = React.useState('')
  const optionsRef = useRef<HTMLDivElement>(null) // Ref for scroll detection

  // Remove internal filtering - rely on parent to provide filtered items
  // const filteredItems =
  //   query === ''
  //     ? items
  //     : items.filter((item) =>
  //         item.label
  //           .toLowerCase()
  //           .replace(/\s+/g, '')
  //           .includes(query.toLowerCase().replace(/\s+/g, ''))
  //       )

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = event.target.value;
    setQuery(newQuery); // Keep internal query state for potential use (e.g., highlighting)
    if (onSearch) {
      onSearch(newQuery); // Trigger external search handler
    }
  }

  // Scroll handler
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    // Check if scrolled near the bottom
    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 50; // 50px threshold

    if (isNearBottom && hasMore && !isLoadingMore && onLoadMore) {
      onLoadMore();
    }
  }, [hasMore, isLoadingMore, onLoadMore]);

  return (
    <div className={cn("relative w-full", className)}>
      <HeadlessUICombobox
        value={value}
        onChange={onChange}
        disabled={disabled}
      >
        <div className="relative">
          {/* Use Combobox.Input as the main element */}
          <HeadlessUICombobox.Input
            className="relative w-full cursor-default rounded-md border border-input bg-transparent py-2 pl-3 pr-10 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            displayValue={(val: string) =>
              (selectedItemData && selectedItemData.value === val)
                ? selectedItemData.label
                : items.find(item => item.value === val)?.label || ''
            }
            onChange={handleInputChange}
            placeholder={placeholder}
          />
          <HeadlessUICombobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon
              className="h-5 w-5 text-muted-foreground"
              aria-hidden="true"
            />
          </HeadlessUICombobox.Button>

          {/* Keep Transition for the dropdown */}
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery('')} // Reset query on close
          >
            {/* Add ref and onScroll handler to the options container */}
            <HeadlessUICombobox.Options
              ref={optionsRef}
              onScroll={handleScroll}
              className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover py-1 text-popover-foreground shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
            >
              {loading ? (
                 <div className="relative cursor-default select-none px-4 py-2 text-muted-foreground">
                   Loading...
                 </div>
              // Use items.length for empty check now, and check query to differentiate between no results and initial state
              ) : items.length === 0 && query !== '' ? (
                 emptyContent || (
                    <div className="relative cursor-default select-none px-4 py-2 text-muted-foreground">
                      Nothing found.
                    </div>
                  )
              ) : items.length === 0 && query === '' && !loading ? (
                 // Optional: Different message for initial empty state before searching
                 <div className="relative cursor-default select-none px-4 py-2 text-muted-foreground">
                    Type to search...
                  </div>
              ) : (
                <>
                  {/* Map directly over the items prop */}
                  {items.map((item) => (
                    <HeadlessUICombobox.Option
                      key={item.value}
                      value={item.value}
                      disabled={item.disabled}
                      className={({ active }) =>
                        cn(
                          'relative cursor-default select-none py-2 pl-10 pr-4 text-sm',
                          active ? 'bg-accent text-accent-foreground' : 'text-popover-foreground',
                          item.disabled ? "opacity-50 cursor-not-allowed" : ""
                        )
                      }
                    >
                      {({ selected, active }) => (
                        <>
                          <span
                            className={cn(
                              'block truncate',
                              selected ? 'font-medium' : 'font-normal'
                            )}
                          >
                            {item.label}
                          </span>
                          {item.description && (
                              <span className={cn(
                                "block truncate text-xs",
                                active ? 'text-accent-foreground/80' : 'text-muted-foreground'
                              )}>
                                {item.description}
                              </span>
                            )}
                          {selected ? (
                            <span
                              className={cn(
                                'absolute inset-y-0 left-0 flex items-center pl-3',
                                active ? 'text-accent-foreground' : 'text-primary'
                              )}
                            >
                              <CheckIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                          ) : null}
                        </>
                      )}
                    </HeadlessUICombobox.Option>
                  ))}
                  {isLoadingMore && (
                    <div className="relative cursor-default select-none px-4 py-2 text-muted-foreground text-center">
                      Đang tải thêm khách hàng...
                    </div>
                  )}
                  {hasMore && !isLoadingMore && onLoadMore && (
                    <button
                      type="button"
                      className="w-full py-3 px-3 text-sm font-medium text-blue-600 bg-blue-50 text-center cursor-pointer hover:bg-blue-100 flex items-center justify-center border-t border-b border-blue-100"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onLoadMore();
                      }}
                    >
                      Tải thêm khách hàng
                    </button>
                  )}
                </>
              )}
            </HeadlessUICombobox.Options>
          </Transition>
        </div>
      </HeadlessUICombobox>
    </div>
  )
}