export default function CreatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <main className="min-h-screen">
        {children}
      </main>
    </div>
  )
} 