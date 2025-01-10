import { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from "sonner"
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Chat Genius',
  description: 'A real-time messaging platform for teams and businesses',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {children}
        <Toaster richColors />
      </body>
    </html>
  )
}

