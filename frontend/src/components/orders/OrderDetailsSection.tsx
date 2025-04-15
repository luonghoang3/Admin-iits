import React, { useEffect, useState } from 'react'
import { CalendarIcon, BuildingOffice2Icon as Building2Icon, UserGroupIcon } from "@heroicons/react/24/outline"
import { format } from "date-fns"

// ShadCN components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

// Types
import { OrderFormData, Team } from '@/types/orders'

// Hooks
import { createClient } from '@/utils/supabase/client'

interface OrderDetailsSectionProps {
  formData: OrderFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleValueChange: (name: string, value: any) => void;
  previewOrderNumber?: string;
  isEditMode?: boolean;
}

const OrderDetailsSection: React.FC<OrderDetailsSectionProps> = ({
  formData,
  handleChange,
  handleValueChange,
  previewOrderNumber,
  isEditMode = false
}) => {
  // Ensure values are never undefined
  const type = formData.type || 'international';
  const department = formData.department || 'marine';
  const order_date = formData.order_date || '';
  const status = formData.status || 'draft';
  const client_ref_code = formData.client_ref_code || '';
  const inspection_date_started = formData.inspection_date_started || '';
  const inspection_date_completed = formData.inspection_date_completed || '';
  const inspection_place = formData.inspection_place || '';

  // Sử dụng hook để lấy danh sách teams
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // Lấy danh sách teams khi component mount
  useEffect(() => {
    async function loadTeams() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('teams')
          .select('*')
          .order('name');

        if (error) throw error;
        setTeams(data || []);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách teams:', error);
      } finally {
        setLoading(false);
      }
    }

    loadTeams();
  }, []);

  // Lấy thông tin team từ team_id
  const getTeamById = (teamId: string): Team | undefined => {
    return teams.find(team => team.id === teamId);
  };

  // Map type values to display text
  const typeDisplay = {
    'international': 'International',
    'local': 'Local'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Building2Icon className="h-5 w-5 mr-2 text-gray-500" />
          Order Details
          {(formData?.order_number || previewOrderNumber) && (
            <span className="ml-auto text-sm text-gray-500">
              Order number: <span className="font-semibold">{formData?.order_number || previewOrderNumber}</span>
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="type">Order Type</Label>
            {isEditMode ? (
              <div className="border rounded-md px-3 py-2 bg-muted text-muted-foreground">
                {typeDisplay[type as keyof typeof typeDisplay]}
              </div>
            ) : (
              <Select
                value={type}
                onValueChange={(value) => handleValueChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="international">International</SelectItem>
                  <SelectItem value="local">Local</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="team_id">Team</Label>
            {isEditMode ? (
              <div className="border rounded-md px-3 py-2 bg-muted text-muted-foreground">
                {getTeamById(formData.team_id)?.name || 'Unknown Team'}
              </div>
            ) : (
              <Select
                value={formData.team_id}
                onValueChange={(value) => handleValueChange('team_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      <div className="flex items-center">
                        <UserGroupIcon className="h-4 w-4 mr-2" />
                        {team.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="order_date">Order Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !order_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {order_date ? format(new Date(order_date), "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={order_date ? new Date(order_date) : undefined}
                  onSelect={(date) => date && handleValueChange('order_date', format(date, 'yyyy-MM-dd'))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={status}
              onValueChange={(value) => handleValueChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 col-span-2">
            <Label htmlFor="client_ref_code">Client Reference</Label>
            <Input
              id="client_ref_code"
              name="client_ref_code"
              value={client_ref_code}
              onChange={handleChange}
              placeholder="Client reference code"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inspection_date_started">Inspection Start</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !inspection_date_started && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {inspection_date_started ? format(new Date(inspection_date_started), "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={inspection_date_started ? new Date(inspection_date_started) : undefined}
                  onSelect={(date) => date && handleValueChange('inspection_date_started', format(date, 'yyyy-MM-dd'))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inspection_date_completed">Inspection Completion</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !inspection_date_completed && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {inspection_date_completed ? format(new Date(inspection_date_completed), "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={inspection_date_completed ? new Date(inspection_date_completed) : undefined}
                  onSelect={(date) => date && handleValueChange('inspection_date_completed', format(date, 'yyyy-MM-dd'))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2 col-span-2">
            <Label htmlFor="inspection_place">Inspection Place</Label>
            <Input
              id="inspection_place"
              name="inspection_place"
              value={inspection_place}
              onChange={handleChange}
              placeholder="Location where inspection was conducted"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default OrderDetailsSection