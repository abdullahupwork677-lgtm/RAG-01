import type { ReactNode } from 'react'
import './globals.css'
import './dark-mode.css'

export const metadata = {
  title: 'AI Document Assistant',
  description: 'Upload, search, and chat with your documents',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
