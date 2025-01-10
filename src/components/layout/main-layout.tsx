import { Header } from "@/components/header"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex-1 flex flex-col">
      <Header />
      <main className="flex-1 h-[calc(100vh-4rem)]">
        {children}
      </main>
    </div>
  )
} 