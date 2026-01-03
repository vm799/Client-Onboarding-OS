'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Upload } from 'lucide-react'
import type { Workspace } from '@/lib/database.types'

export default function SettingsPage() {
  const supabase = createClient()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [name, setName] = useState('')
  const [brandColor, setBrandColor] = useState('#000000')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    async function loadWorkspace() {
      const { data: { user } } = await supabase.auth.getUser()

      const { data: profile } = await supabase
        .from('profiles')
        .select('current_workspace_id')
        .eq('id', user!.id)
        .single()

      const { data: workspaceData } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', profile!.current_workspace_id!)
        .single()

      if (workspaceData) {
        setWorkspace(workspaceData)
        setName(workspaceData.name)
        setBrandColor(workspaceData.brand_color)
        setLogoUrl(workspaceData.logo_url)
      }

      setLoading(false)
    }

    loadWorkspace()
  }, [supabase])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !workspace) return

    try {
      const ext = file.name.split('.').pop()
      const fileName = `${workspace.id}-logo.${ext}`
      const filePath = `logos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('workspace-assets')
        .upload(filePath, file, {
          upsert: true,
        })

      if (uploadError) {
        // Try to create bucket if it doesn't exist
        if (uploadError.message.includes('bucket')) {
          await supabase.storage.createBucket('workspace-assets', {
            public: true,
          })
          // Retry upload
          await supabase.storage
            .from('workspace-assets')
            .upload(filePath, file, { upsert: true })
        } else {
          throw uploadError
        }
      }

      const { data: urlData } = supabase.storage
        .from('workspace-assets')
        .getPublicUrl(filePath)

      setLogoUrl(urlData.publicUrl)
      toast({
        title: 'Logo uploaded',
        description: 'Remember to save your changes',
      })
    } catch (error) {
      console.error(error)
      toast({
        title: 'Error',
        description: 'Failed to upload logo',
        variant: 'destructive',
      })
    }
  }

  const handleSave = async () => {
    if (!workspace) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('workspaces')
        .update({
          name,
          brand_color: brandColor,
          logo_url: logoUrl,
        })
        .eq('id', workspace.id)

      if (error) throw error

      toast({
        title: 'Settings saved',
        description: 'Your workspace settings have been updated',
      })
    } catch (error) {
      console.error(error)
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your workspace settings and branding
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
          <CardDescription>
            Update your workspace name and branding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Workspace Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Company Name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">Logo</Label>
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <div className="w-16 h-16 rounded border overflow-hidden relative">
                  <Image
                    src={logoUrl}
                    alt="Logo"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded border flex items-center justify-center bg-muted">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="max-w-xs"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended: 200x200px, PNG or JPG
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand-color">Brand Color</Label>
            <div className="flex items-center gap-3">
              <Input
                id="brand-color"
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-16 h-10 p-1"
              />
              <Input
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                placeholder="#000000"
                className="max-w-[120px] font-mono"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              This color will be used in your client portal
            </p>
          </div>

          <div className="pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            See how your branding will appear to clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <div className="w-10 h-10 rounded overflow-hidden relative">
                  <Image
                    src={logoUrl}
                    alt="Logo preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div
                  className="w-10 h-10 rounded flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: brandColor }}
                >
                  {name[0] || 'W'}
                </div>
              )}
              <span className="font-semibold">{name || 'Your Workspace'}</span>
            </div>
            <div className="mt-4 p-3 rounded text-center text-white text-sm font-medium" style={{ backgroundColor: brandColor }}>
              Sample Button
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
