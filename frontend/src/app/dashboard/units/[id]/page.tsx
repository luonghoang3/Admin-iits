'use client'

import { useRouter, useParams } from 'next/navigation'
import { useState } from 'react'
import { Unit } from '@/types/orders.d'

export default function UnitDetailPage() {
  const router = useRouter()
  const params = useParams()
  
  // Access params directly instead of using React.use()
  const unitId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unit, setUnit] = useState<Unit | null>(null)
  
  // ... existing code ...
} 