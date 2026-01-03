import { Loader2 } from 'lucide-react'

export default function PortalLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading your onboarding...</p>
      </div>
    </div>
  )
}
