"use client"

import * as React from "react"
import { Fragment, useRef, useCallback } from "react"
import { Combobox as HeadlessUICombobox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid"
import { cn } from "@/lib/utils"

export interface HierarchicalComboboxItem {
  value: string
  label: string
  description?: string
  disabled?: boolean
  level?: number
  isCategory?: boolean
  categoryId?: string
}

interface HierarchicalComboboxProps {
  items: HierarchicalComboboxItem[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  loading?: boolean
  onSearch?: (query: string) => void
  emptyContent?: React.ReactNode
  loadingContent?: React.ReactNode
  showSelected?: boolean
  className?: string
  onLoadMore?: () => void
  hasMore?: boolean
  isLoadingMore?: boolean
  selectedItemData?: HierarchicalComboboxItem | null
}

export function HierarchicalCombobox({
  items,
  value = '',
  onChange,
  placeholder = "Select an option",
  disabled = false,
  loading = false,
  onSearch,
  emptyContent,
  loadingContent,
  showSelected = false,
  className,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  selectedItemData = null
}: HierarchicalComboboxProps) {
  const [query, setQuery] = React.useState('')
  const optionsRef = useRef<HTMLDivElement>(null) // Ref for scroll detection

  // Handle scroll for infinite loading
  const handleScroll = useCallback(() => {
    if (!optionsRef.current || !onLoadMore || !hasMore || isLoadingMore) return

    const { scrollTop, scrollHeight, clientHeight } = optionsRef.current
    // If scrolled to bottom (with a small threshold)
    if (scrollHeight - scrollTop - clientHeight < 50) {
      onLoadMore()
    }
  }, [onLoadMore, hasMore, isLoadingMore])

  // Handle input change for search
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setQuery(value)
    onSearch?.(value)
  }, [onSearch])

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
              className="h-5 w-5 text-gray-400"
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
              ) : items.length === 0 && query === '' && !loading ? (
                 // Optional: Different message for initial empty state before searching
                 <div className="relative cursor-default select-none px-4 py-2 text-muted-foreground">
                    Type to search...
                  </div>
              ) : items.length === 0 ? (
                emptyContent || (
                  <div className="relative cursor-default select-none px-4 py-2 text-muted-foreground">
                    No results found
                  </div>
                )
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
                          'relative cursor-default select-none py-2 pr-4 text-sm',
                          active ? 'bg-accent text-accent-foreground' : 'text-popover-foreground',
                          item.disabled ? "opacity-50 cursor-not-allowed" : "",
                          item.isCategory ? "font-semibold" : ""
                        )
                      }
                    >
                      {({ selected, active }) => (
                        <>
                          <span
                            className={cn(
                              'block truncate',
                              selected ? 'font-medium' : 'font-normal',
                              item.isCategory ? "font-semibold" : ""
                            )}
                            style={{
                              paddingLeft: item.level ? `${(item.level * 16) + 10}px` : "10px"
                            }}
                          >
                            {item.isCategory ? '📁 ' : ''}{item.label}
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
                      Loading more...
                    </div>
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
