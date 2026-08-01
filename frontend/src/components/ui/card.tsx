"use client"

import { ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

interface CardProps {
  children: ReactNode
  className?: string
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
}

interface CardTitleProps {
  children: ReactNode
  className?: string
}

interface CardContentProps {
  children: ReactNode
  className?: string
}

const Card = ({ children, className }: CardProps) => (
  <div className={twMerge('rounded-lg border bg-card text-card-foreground shadow-sm', className)}>
    {children}
  </div>
)

const CardHeader = ({ children, className }: CardHeaderProps) => (
  <div className={twMerge('flex flex-col space-y-1.5 p-6', className)}>{children}</div>
)

const CardTitle = ({ children, className }: CardTitleProps) => (
  <h3 className={twMerge('text-2xl font-semibold leading-none tracking-tight', className)}>{children}</h3>
)

const CardContent = ({ children, className }: CardContentProps) => (
  <div className={twMerge('p-6 pt-0', className)}>{children}</div>
)

export { Card, CardHeader, CardTitle, CardContent }
