'use client';

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
// @ts-ignore
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
// @ts-ignore
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';

interface DashboardErrorProps {
  error: string;
}

export default function DashboardError({ error }: DashboardErrorProps) {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      <Alert variant="destructive" className="max-w-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Lỗi khi tải dữ liệu Dashboard</AlertTitle>
        <AlertDescription>
          <p className="mt-2">{error}</p>
          <p className="mt-4">Vui lòng thử lại sau hoặc liên hệ với quản trị viên nếu lỗi vẫn tiếp tục xảy ra.</p>
        </AlertDescription>
      </Alert>
      <Button 
        variant="outline" 
        className="mt-4" 
        onClick={handleRefresh}
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Tải lại trang
      </Button>
    </div>
  );
}
