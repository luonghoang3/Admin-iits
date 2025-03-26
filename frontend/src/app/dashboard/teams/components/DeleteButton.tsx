'use client'

import { useState } from 'react'

export default function DeleteButton({ teamId }: { teamId: number }) {
  const [isConfirming, setIsConfirming] = useState(false)
  
  const startDelete = () => {
    setIsConfirming(true)
  }
  
  const cancelDelete = () => {
    setIsConfirming(false)
  }
  
  if (isConfirming) {
    return (
      <span className="inline-flex space-x-1">
        <button
          form={`delete-team-${teamId}`}
          type="submit"
          className="px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Xác nhận
        </button>
        <button
          type="button"
          onClick={cancelDelete}
          className="px-2 py-1 bg-gray-400 text-white rounded text-sm hover:bg-gray-500"
        >
          Hủy
        </button>
      </span>
    )
  }
  
  return (
    <button
      type="button"
      onClick={startDelete}
      className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
    >
      Xóa
    </button>
  )
} 