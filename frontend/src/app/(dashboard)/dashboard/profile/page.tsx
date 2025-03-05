'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Copy, ExternalLink } from 'lucide-react'

const formSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional(),
})

type FormData = z.infer<typeof formSchema>

export default function ProfilePage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const { user } = useAuthStore()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  })

  useEffect(() => {
    if (user) {
      setValue('email', user.email || '')
      setValue('fullName', user.user_metadata.full_name || '')
    }
  }, [user, setValue])

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)

      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: data.fullName,
        },
      })

      if (error) throw error

      setSuccess('Profile updated successfully')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const shareableLink = user ? `${window.location.origin}/creator/${user.id}` : ''

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const openPreview = () => {
    window.open(shareableLink, '_blank')
  }

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>
            Update your personal information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                disabled
                {...register('email')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                {...register('fullName')}
              />
              {errors.fullName && (
                <p className="text-sm text-red-500">{errors.fullName.message}</p>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 text-green-600 border-green-200">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Share Your Profile</CardTitle>
          <CardDescription>
            Share this link with potential subscribers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Input
              readOnly
              value={shareableLink}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={copyToClipboard}
              className="shrink-0"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={openPreview}
              className="shrink-0"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            This link shows your public profile with all your active groups and subscription plans.
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 