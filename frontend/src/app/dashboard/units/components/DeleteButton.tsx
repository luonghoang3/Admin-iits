'use client'

import { useState } from 'react'

interface DeleteButtonProps {
  unitId: string
}

export default function DeleteButton({ unitId }: DeleteButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false)
  
  const handleClick = () => {
    setIsConfirming(true)
  }
  
  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsConfirming(false)
  }
  
  if (isConfirming) {
    return (
      <span className="inline-flex items-center">
        <button 
          type="submit" 
          className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
        >
          Xác nhận
        </button>
        <button 
          onClick={handleCancel}
          className="px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400 ml-1"
        >
          Hủy
        </button>
      </span>
    )
  }
  
  return (
    <button
      onClick={handleClick} 
      className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
      type="button"
    >
      Xóa
    </button>
  )
} 