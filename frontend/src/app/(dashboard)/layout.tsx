import { DashboardNav } from '@/components/layout/DashboardNav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="flex h-16 items-center px-4">
          <div className="text-xl font-bold">Groopie</div>
          <DashboardNav />
        </div>
      </header>
      <main className="flex-1 container mx-auto py-6">
        {children}
      </main>
    </div>
  )
} 