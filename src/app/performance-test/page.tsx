'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import CommodityTreeSelect from '@/components/orders/CommodityTreeSelect'
import CommodityTreeSelectWithPerformance from '@/components/orders/CommodityTreeSelectWithPerformance'
import OrderItemDialog from '@/components/orders/dialogs/OrderItemDialog'
import OrderItemDialogWithPerformance from '@/components/orders/dialogs/OrderItemDialogWithPerformance'
import { fetchCommodities, fetchUnits } from '@/utils/supabase/client'
import { Commodity, Unit } from '@/types/orders'
import logger from '@/lib/logger'

export default function PerformanceTestPage() {
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCommodity, setSelectedCommodity] = useState('')
  const [commodityCount, setCommodityCount] = useState(100)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPerformanceDialogOpen, setIsPerformanceDialogOpen] = useState(false)
  const [currentItem, setCurrentItem] = useState<Partial<any>>({})

  // Tải dữ liệu
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Tải commodities
        const { commodities: loadedCommodities } = await fetchCommodities({ limit: 1000 })
        setCommodities(loadedCommodities || [])
        
        // Tải units
        const { units: loadedUnits } = await fetchUnits()
        setUnits(loadedUnits || [])
        
        logger.error(`[Performance] Loaded ${loadedCommodities?.length || 0} commodities and ${loadedUnits?.length || 0} units`)
      } catch (error) {
        logger.error('[Performance] Error loading data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [])
  
  // Lọc commodities theo số lượng
  const filteredCommodities = commodities.slice(0, commodityCount)
  
  // Xử lý tìm kiếm
  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }
  
  // Xử lý thay đổi số lượng
  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = parseInt(e.target.value)
    if (!isNaN(count) && count > 0 && count <= commodities.length) {
      setCommodityCount(count)
    }
  }
  
  // Xử lý thay đổi giá trị
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCurrentItem(prev => ({ ...prev, [name]: value }))
  }
  
  // Xử lý thay đổi select
  const handleSelectChange = (field: string, value: any) => {
    setCurrentItem(prev => ({ ...prev, [field]: value }))
  }
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Performance Testing Page</h1>
      
      <Tabs defaultValue="component">
        <TabsList>
          <TabsTrigger value="component">Component Test</TabsTrigger>
          <TabsTrigger value="dialog">Dialog Test</TabsTrigger>
        </TabsList>
        
        <TabsContent value="component" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Configuration</CardTitle>
              <CardDescription>Configure the test parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="commodityCount">Number of Commodities</Label>
                  <Input 
                    id="commodityCount" 
                    type="number" 
                    value={commodityCount} 
                    onChange={handleCountChange}
                    min="1"
                    max={commodities.length}
                  />
                  <p className="text-sm text-muted-foreground">
                    Total available: {commodities.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Original Component</CardTitle>
                <CardDescription>CommodityTreeSelect without performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <CommodityTreeSelect
                  commodities={filteredCommodities}
                  value={selectedCommodity}
                  onChange={setSelectedCommodity}
                  placeholder="Select a commodity..."
                  disabled={isLoading}
                  onSearch={handleSearch}
                  loading={isLoading}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <p className="text-sm text-muted-foreground">
                  Items: {filteredCommodities.length}
                </p>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Performance Component</CardTitle>
                <CardDescription>CommodityTreeSelect with performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <CommodityTreeSelectWithPerformance
                  commodities={filteredCommodities}
                  value={selectedCommodity}
                  onChange={setSelectedCommodity}
                  placeholder="Select a commodity..."
                  disabled={isLoading}
                  onSearch={handleSearch}
                  loading={isLoading}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <p className="text-sm text-muted-foreground">
                  Check console for performance metrics
                </p>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="dialog" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dialog Test</CardTitle>
              <CardDescription>Test the performance of the dialog component</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={() => setIsDialogOpen(true)}>
                  Open Original Dialog
                </Button>
                <Button onClick={() => setIsPerformanceDialogOpen(true)}>
                  Open Performance Dialog
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Original Dialog */}
      <OrderItemDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        isEditing={false}
        currentItem={currentItem}
        commodities={filteredCommodities}
        units={units}
        error={null}
        handleChange={handleChange}
        handleSelectChange={handleSelectChange}
        handleSave={() => setIsDialogOpen(false)}
        handleClose={() => setIsDialogOpen(false)}
        commoditySearch={searchQuery}
        unitSearch=""
        handleCommoditySearch={handleSearch}
        isLoadingCommodities={isLoading}
        isLoadingUnits={isLoading}
      />
      
      {/* Performance Dialog */}
      <OrderItemDialogWithPerformance
        open={isPerformanceDialogOpen}
        onOpenChange={setIsPerformanceDialogOpen}
        isEditing={false}
        currentItem={currentItem}
        commodities={filteredCommodities}
        units={units}
        error={null}
        handleChange={handleChange}
        handleSelectChange={handleSelectChange}
        handleSave={() => setIsPerformanceDialogOpen(false)}
        handleClose={() => setIsPerformanceDialogOpen(false)}
        commoditySearch={searchQuery}
        unitSearch=""
        handleCommoditySearch={handleSearch}
        isLoadingCommodities={isLoading}
        isLoadingUnits={isLoading}
      />
    </div>
  )
}
