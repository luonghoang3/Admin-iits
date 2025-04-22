'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Commodity, Category } from '@/types/commodities'

interface CommodityForm {
  name: string
  description?: string
  category_id?: string
}

interface CommodityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  error: string | null
  handleSave: (commodity: CommodityForm) => Promise<void>
  isLoading: boolean
}

export default function CommodityDialog({
  open,
  onOpenChange,
  categories,
  error,
  handleSave,
  isLoading
}: CommodityDialogProps) {
  const [form, setForm] = useState<CommodityForm>({
    name: '',
    description: '',
    category_id: ''
  })

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setForm({
        name: '',
        description: '',
        category_id: ''
      })
    }
  }, [open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCategoryChange = (value: string) => {
    setForm(prev => ({
      ...prev,
      category_id: value
    }))
  }

  const handleSubmit = async () => {
    if (!form.name) {
      return
    }

    await handleSave(form)
  }

  // Group categories by parent/child relationship
  const groupedCategories = React.useMemo(() => {
    if (!categories || categories.length === 0) return []

    const parentCategories = categories.filter(c => !c.parent_id)
    const childCategories = categories.filter(c => c.parent_id)

    return parentCategories.map(parent => ({
      parent,
      children: childCategories.filter(child => child.parent_id === parent.id)
    }))
  }, [categories])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Commodity</DialogTitle>
          <DialogDescription>
            Create a new commodity that will be available for all orders.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2">
            <Label htmlFor="name">Name*</Label>
            <Input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter commodity name"
              disabled={isLoading}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category_id">Category</Label>
            <Select
              value={form.category_id || ''}
              onValueChange={handleCategoryChange}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto">
                <SelectItem value="none">None</SelectItem>
                {groupedCategories.map(group => (
                  <React.Fragment key={group.parent.id}>
                    <SelectItem value={group.parent.id} className="font-bold">
                      {group.parent.name}
                    </SelectItem>
                    {group.children.map(child => (
                      <SelectItem key={child.id} value={child.id} className="pl-6">
                        {child.name}
                      </SelectItem>
                    ))}
                  </React.Fragment>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              name="description"
              value={form.description || ''}
              onChange={handleChange}
              placeholder="Enter description"
              rows={3}
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!form.name || isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Commodity'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
