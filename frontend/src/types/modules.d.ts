declare module '@/components/ui/use-toast' {
  import { ToastProps, ToastActionElement } from '@/components/ui/toast-types';
  
  interface UseToastReturn {
    toast: (props: Omit<ToastProps, "id">) => {
      id: string;
      dismiss: () => void;
      update: (props: ToastProps) => void;
    };
    dismiss: (toastId?: string) => void;
    toasts: Array<ToastProps & { id: string }>;
  }
  
  export function useToast(): UseToastReturn;
  export function toast(props: Omit<ToastProps, "id">): {
    id: string;
    dismiss: () => void;
    update: (props: ToastProps) => void;
  };
}

declare module '@/utils/supabase/buyers' {
  import { Buyer } from '@/types/orders';
  
  export function fetchBuyers(options?: {
    page?: number;
    limit?: number;
    searchQuery?: string;
    essentialFieldsOnly?: boolean;
  }): Promise<{
    data: Buyer[];
    hasMore: boolean;
    error: string | null;
  }>;
  
  export function fetchBuyer(buyerId: string): Promise<{
    data: Buyer | null;
    error: string | null;
  }>;
  
  export function createBuyer(data: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    team_ids?: string[];
  }): Promise<{
    data: Buyer | null;
    error: string | null;
  }>;
  
  export function updateBuyer(
    buyerId: string,
    data: {
      name?: string;
      address?: string;
      phone?: string;
      email?: string;
      team_ids?: string[];
    }
  ): Promise<{
    data: Buyer | null;
    error: string | null;
  }>;
  
  export function deleteBuyer(buyerId: string): Promise<{
    success: boolean;
    error: string | null;
  }>;
} 