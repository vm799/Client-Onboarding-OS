'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export function CopyLinkButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleCopy = async () => {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    toast({
      title: 'Copied',
      description: 'Link copied to clipboard',
    })
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="outline" className="w-full gap-2" onClick={handleCopy}>
      {copied ? (
        <>
          <Check className="h-4 w-4 text-green-600" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          Copy Link
        </>
      )}
    </Button>
  )
}
