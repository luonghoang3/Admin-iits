import React from "react"
import { Table } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Filter } from "lucide-react"
import { UserGroupIcon } from "@heroicons/react/24/outline"

interface DataTableFiltersProps<TData> {
  table: Table<TData>
  teamOptions: Array<{value: string, label: string}>
  statusOptions: Array<{value: string, label: string}>
  clientOptions: Array<{value: string, label: string}>
  selectedTeams: Set<string>
  setSelectedTeams: React.Dispatch<React.SetStateAction<Set<string>>>
  selectedStatuses: Set<string>
  setSelectedStatuses: React.Dispatch<React.SetStateAction<Set<string>>>
  selectedClients: Set<string>
  setSelectedClients: React.Dispatch<React.SetStateAction<Set<string>>>
}

export function DataTableFilters<TData>({
  table,
  teamOptions,
  statusOptions,
  clientOptions,
  selectedTeams,
  setSelectedTeams,
  selectedStatuses,
  setSelectedStatuses,
  selectedClients,
  setSelectedClients,
}: DataTableFiltersProps<TData>) {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex flex-1 items-center space-x-2">
        {/* Team filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              <UserGroupIcon className="mr-2 h-4 w-4" /> Team
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {teamOptions.map(option => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={selectedTeams.has(option.value)}
                onCheckedChange={(checked) => {
                  const newSet = new Set(selectedTeams);
                  if (checked) {
                    newSet.add(option.value);
                  } else {
                    newSet.delete(option.value);
                  }
                  setSelectedTeams(newSet);
                  
                  // Áp dụng bộ lọc vào cột team_name
                  const teamColumn = table.getColumn("team_name");
                  if (teamColumn) {
                    if (newSet.size === 0) {
                      teamColumn.setFilterValue(undefined);
                    } else {
                      teamColumn.setFilterValue(newSet);
                    }
                  }
                }}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Status filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              <Filter className="mr-2 h-4 w-4" /> Trạng thái
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {statusOptions.map(option => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={selectedStatuses.has(option.value)}
                onCheckedChange={(checked) => {
                  const newSet = new Set(selectedStatuses);
                  if (checked) {
                    newSet.add(option.value);
                  } else {
                    newSet.delete(option.value);
                  }
                  setSelectedStatuses(newSet);
                  
                  // Áp dụng bộ lọc vào cột status
                  const statusColumn = table.getColumn("status");
                  if (statusColumn) {
                    if (newSet.size === 0) {
                      statusColumn.setFilterValue(undefined);
                    } else {
                      statusColumn.setFilterValue(newSet);
                    }
                  }
                }}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Client filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              <Filter className="mr-2 h-4 w-4" /> Khách hàng
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto">
            {clientOptions.map(option => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={selectedClients.has(option.value)}
                onCheckedChange={(checked) => {
                  const newSet = new Set(selectedClients);
                  if (checked) {
                    newSet.add(option.value);
                  } else {
                    newSet.delete(option.value);
                  }
                  setSelectedClients(newSet);
                  
                  // Áp dụng bộ lọc vào cột client_name
                  const clientColumn = table.getColumn("client_name");
                  if (clientColumn) {
                    if (newSet.size === 0) {
                      clientColumn.setFilterValue(undefined);
                    } else {
                      clientColumn.setFilterValue(newSet);
                    }
                  }
                }}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
