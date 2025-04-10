import { useState, useCallback, useEffect } from 'react'

/**
 * Generic hook for managing form state, changes, and validation
 */
export function useFormState<T extends Record<string, any>>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isDirty, setIsDirty] = useState(false)
  const [initialState] = useState(initialValues)
  
  // Update dirty state whenever values change
  useEffect(() => {
    const isValuesDifferent = Object.keys(values).some(key => {
      // Compare with initial values
      return JSON.stringify(values[key]) !== JSON.stringify(initialState[key])
    })
    
    setIsDirty(isValuesDifferent)
  }, [values, initialState])
  
  /**
   * Handle form input changes
   */
  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    const newValue = type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked 
      : value
    
    setValues(prev => ({
      ...prev,
      [name]: newValue
    }))
    
    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [name]: true
    }))
  }, [])
  
  /**
   * Set a single form field value
   */
  const setValue = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }))
  }, [])
  
  /**
   * Set multiple form field values at once
   */
  const setMultipleValues = useCallback((newValues: Partial<T>) => {
    setValues(prev => ({
      ...prev,
      ...newValues
    }))
  }, [])
  
  /**
   * Reset the form to initial values
   */
  const reset = useCallback(() => {
    setValues(initialState)
    setErrors({})
    setTouched({})
    setIsDirty(false)
  }, [initialState])
  
  /**
   * Check if the form has any errors
   */
  const hasErrors = useCallback(() => {
    return Object.keys(errors).length > 0
  }, [errors])
  
  return {
    values,
    setValues,
    errors,
    setErrors,
    touched,
    setTouched,
    isDirty,
    handleChange,
    setValue,
    setMultipleValues,
    reset,
    hasErrors
  }
} 