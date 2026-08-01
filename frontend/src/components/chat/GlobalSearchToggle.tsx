"use client"

import { useState, useEffect } from 'react'
import { twMerge } from 'tailwind-merge'

interface GlobalSearchToggleProps {
  onSearchToggle: (enabled: boolean) => void
}

export default function GlobalSearchToggle({ onSearchToggle }: GlobalSearchToggleProps) {
  const [isSearchEnabled, setIsSearchEnabled] = useState(false)

  useEffect(() => {
    onSearchToggle(isSearchEnabled)
  }, [isSearchEnabled, onSearchToggle])

  return (
    <div className="flex items-center space-x-3">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Global Search</span>
      <button
        onClick={() => setIsSearchEnabled(!isSearchEnabled)}
        className={twMerge(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          isSearchEnabled
            ? 'bg-primary-500'
            : 'bg-gray-200 dark:bg-gray-700'
        )}
      >
        <span
          className={twMerge(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
            isSearchEnabled ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  )
}
