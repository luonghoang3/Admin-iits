'use client'

import { memo, useState } from 'react'
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TopClientByOrders, TopClientByRevenue } from '@/hooks/useTopClients'
import { formatCurrency } from '@/lib/utils'

interface TopClientsStatsProps {
  topClientsByOrders: TopClientByOrders[]
  topClientsByRevenue: TopClientByRevenue[]
  selectedYear: number
  availableYears: number[]
  onYearChange: (value: string) => void
  loading: boolean
}

const TopClientsStats = memo(({
  topClientsByOrders,
  topClientsByRevenue,
  selectedYear,
  availableYears,
  onYearChange,
  loading
}: TopClientsStatsProps) => {
  const [activeTab, setActiveTab] = useState<string>("orders")

  return (
    <Card className="w-full h-full flex flex-col">
      <div className="px-4 pt-3 pb-1 flex flex-row items-center justify-between">
        <h3 className="text-base font-semibold">Top khách hàng năm {selectedYear}</h3>
        <div className="flex items-center">
          <Select value={selectedYear.toString()} onValueChange={onYearChange}>
            <SelectTrigger className="w-[90px] h-7 text-xs">
              <SelectValue placeholder={selectedYear.toString()} />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b px-4">
          <TabsList className="h-9">
            <TabsTrigger value="orders" className="text-xs">Theo số đơn hàng</TabsTrigger>
            <TabsTrigger value="revenue" className="text-xs">Theo doanh thu</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="orders" className="flex-1 p-0 data-[state=active]:flex data-[state=active]:flex-col">
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-1 px-2 text-xs font-medium text-muted-foreground w-[10%]">STT</th>
                    <th className="text-left py-1 px-2 text-xs font-medium text-muted-foreground w-[70%]">Khách hàng</th>
                    <th className="text-right py-1 pr-4 text-xs font-medium text-muted-foreground w-[20%]">Số đơn hàng</th>
                  </tr>
                </thead>
                <tbody>
                  {topClientsByOrders.length > 0 ? (
                    topClientsByOrders.map((client, index) => (
                      <tr key={client.client_id} className="border-b hover:bg-muted/30">
                        <td className="py-1 px-2 text-xs">{index + 1}</td>
                        <td className="py-1 px-2 text-xs max-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                          {client.client_name}
                        </td>
                        <td className="py-1 px-2 text-xs text-right pr-4">{client.order_count}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-sm text-muted-foreground">
                        Không có dữ liệu
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="flex-1 p-0 data-[state=active]:flex data-[state=active]:flex-col">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
            </div>
          ) : (
            <Tabs defaultValue="vnd" className="w-full h-full flex flex-col">
              <TabsList className="grid grid-cols-2 h-8 w-[200px] mx-4 mt-2">
                <TabsTrigger value="vnd" className="text-xs">VND</TabsTrigger>
                <TabsTrigger value="usd" className="text-xs">USD</TabsTrigger>
              </TabsList>

              <TabsContent value="vnd" className="pt-2 flex-1 overflow-hidden">
                <table className="w-full border-collapse">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left py-1 px-2 text-xs font-medium text-muted-foreground w-[10%]">STT</th>
                      <th className="text-left py-1 px-2 text-xs font-medium text-muted-foreground w-[60%]">Khách hàng</th>
                      <th className="text-right py-1 pr-4 text-xs font-medium text-muted-foreground w-[30%]">Doanh thu (VND)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Lọc khách hàng có doanh thu VND > 0 hoặc currency là VND
                      const clientsWithVndRevenue = topClientsByRevenue.filter(client =>
                        (client.currency === 'VND' && client.total_revenue_vnd > 0) ||
                        (client.currency === undefined && client.total_revenue_vnd > 0)
                      );

                      if (clientsWithVndRevenue.length > 0) {
                        return clientsWithVndRevenue
                          .sort((a, b) => b.total_revenue_vnd - a.total_revenue_vnd)
                          .map((client, index) => (
                            <tr key={client.client_id} className="border-b hover:bg-muted/30">
                              <td className="py-1 px-2 text-xs">{index + 1}</td>
                              <td className="py-1 px-2 text-xs max-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                                {client.client_name}
                              </td>
                              <td className="py-1 px-2 text-xs text-right pr-4">{formatCurrency(client.total_revenue_vnd)}</td>
                            </tr>
                          ));
                      } else {
                        return (
                          <tr>
                            <td colSpan={3} className="py-4 text-center text-sm text-muted-foreground">
                              Không có dữ liệu doanh thu VND
                            </td>
                          </tr>
                        );
                      }
                    })()}
                  </tbody>
                </table>
              </TabsContent>

              <TabsContent value="usd" className="pt-2 flex-1 overflow-hidden">
                <table className="w-full border-collapse">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left py-1 px-2 text-xs font-medium text-muted-foreground w-[10%]">STT</th>
                      <th className="text-left py-1 px-2 text-xs font-medium text-muted-foreground w-[60%]">Khách hàng</th>
                      <th className="text-right py-1 pr-4 text-xs font-medium text-muted-foreground w-[30%]">Doanh thu (USD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Lọc khách hàng có doanh thu USD > 0 hoặc currency là USD
                      const clientsWithUsdRevenue = topClientsByRevenue.filter(client =>
                        (client.currency === 'USD' && client.total_revenue_usd > 0) ||
                        (client.currency === undefined && client.total_revenue_usd > 0)
                      );

                      if (clientsWithUsdRevenue.length > 0) {
                        return clientsWithUsdRevenue
                          .sort((a, b) => b.total_revenue_usd - a.total_revenue_usd)
                          .map((client, index) => (
                            <tr key={client.client_id} className="border-b hover:bg-muted/30">
                              <td className="py-1 px-2 text-xs">{index + 1}</td>
                              <td className="py-1 px-2 text-xs max-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                                {client.client_name}
                              </td>
                              <td className="py-1 px-2 text-xs text-right pr-4">{formatCurrency(client.total_revenue_usd, 'USD')}</td>
                            </tr>
                          ));
                      } else {
                        return (
                          <tr>
                            <td colSpan={3} className="py-4 text-center text-sm text-muted-foreground">
                              Không có dữ liệu doanh thu USD
                            </td>
                          </tr>
                        );
                      }
                    })()}
                  </tbody>
                </table>
              </TabsContent>
            </Tabs>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  )
})

TopClientsStats.displayName = 'TopClientsStats'

export default TopClientsStats
