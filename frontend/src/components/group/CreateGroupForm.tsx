'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFieldArray } from 'react-hook-form'
import * as z from 'zod'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const subscriptionTierSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Price must be a valid number'),
  features: z.string().min(1, 'Features are required'),
})

const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  group_type: z.enum(['whatsapp', 'slack']),
  group_url: z.string().url('Must be a valid URL'),
  subscriptionTiers: z.array(subscriptionTierSchema).min(1, 'At least one subscription tier is required'),
})

type FormData = z.infer<typeof formSchema>

export function CreateGroupForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('details')
  const { user } = useAuthStore()
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      group_type: 'whatsapp',
      group_url: '',
      subscriptionTiers: [
        {
          name: '',
          description: '',
          price: '',
          features: '',
        },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'subscriptionTiers',
  })

  const groupType = watch('group_type')

  const onSubmit = async (data: FormData) => {
    if (!user) {
      setError('You must be logged in to create a group')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log('Submitting group data:', {
        ...data,
        creator_id: user.id,
      })

      // Create the group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: data.name,
          description: data.description,
          creator_id: user.id,
          group_type: data.group_type,
          status: 'pending',
          ...(data.group_type === 'slack' && {
            slack_channel_url: data.group_url,
          }),
          ...(data.group_type === 'whatsapp' && {
            whatsapp_group_name: data.name,
            whatsapp_group_url: data.group_url,
          }),
        })
        .select()
        .single()

      if (groupError) {
        console.error('Database error:', groupError)
        throw new Error(groupError.message)
      }

      if (!group) {
        throw new Error('No group was created')
      }

      // Create subscription tiers
      const tiersPromises = data.subscriptionTiers.map(tier => {
        return supabase
          .from('plans')
          .insert({
            group_id: group.id,
            name: tier.name,
            description: tier.description,
            price: parseFloat(tier.price),
            features: tier.features.split('\n').map(f => f.trim()).filter(Boolean),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
      })

      const tiersResults = await Promise.all(tiersPromises)
      const tiersError = tiersResults.find(result => result.error)

      if (tiersError) {
        console.error('Error creating subscription tiers:', tiersError)
        throw new Error('Failed to create subscription tiers')
      }

      console.log('Group and subscription tiers created successfully')
      router.push('/dashboard/groups')
    } catch (error) {
      console.error('Error creating group:', error)
      setError(error instanceof Error ? error.message : 'Failed to create group. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card className="border-0 bg-gradient-to-br from-[#FF1493] to-[#9FE870] p-[2px]">
        <div className="bg-white rounded-lg">
          <CardHeader>
            <CardTitle className="bg-gradient-to-r from-[#FF1493] to-[#9FE870] text-transparent bg-clip-text">Create a New Community</CardTitle>
            <CardDescription>
              Turn your expertise into income with a premium WhatsApp community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Community Details</TabsTrigger>
                <TabsTrigger value="tiers">Subscription Plans</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {groupType === 'whatsapp' ? 'WhatsApp Group Name' : 'Slack Channel Name'}
                  </Label>
                  <Input
                    id="name"
                    {...register('name')}
                    disabled={isLoading}
                    placeholder={groupType === 'whatsapp' ? 'Enter your WhatsApp group name' : 'Enter your Slack channel name'}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Community Description</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    disabled={isLoading}
                    placeholder="Tell potential members what makes your community unique and valuable"
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Platform</Label>
                  <RadioGroup
                    defaultValue="whatsapp"
                    {...register('group_type')}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="whatsapp" id="whatsapp" />
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="slack" id="slack" />
                      <Label htmlFor="slack">Slack</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="group_url">
                    {groupType === 'whatsapp' ? 'WhatsApp Group Invite Link' : 'Slack Channel URL'}
                  </Label>
                  <Input
                    id="group_url"
                    {...register('group_url')}
                    disabled={isLoading}
                    placeholder={
                      groupType === 'whatsapp'
                        ? 'https://chat.whatsapp.com/...'
                        : 'https://app.slack.com/client/...'
                    }
                  />
                  {errors.group_url && (
                    <p className="text-sm text-red-500">
                      {errors.group_url.message}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {groupType === 'whatsapp'
                      ? 'Share your WhatsApp group invite link where members will join your community'
                      : 'Add your Slack channel URL where members will join your community'}
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={() => setActiveTab('tiers')}
                  variant="gradient"
                  className="w-full"
                >
                  Next: Set Up Subscription Plans
                </Button>
              </TabsContent>

              <TabsContent value="tiers" className="space-y-6">
                {fields.map((field, index) => (
                  <Card key={field.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Plan {index + 1}</CardTitle>
                        {index > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Plan Name</Label>
                        <Input
                          placeholder="e.g., Basic Access, VIP Member, Elite"
                          {...register(`subscriptionTiers.${index}.name`)}
                        />
                        {errors.subscriptionTiers?.[index]?.name && (
                          <p className="text-sm text-red-500">
                            {errors.subscriptionTiers[index]?.name?.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Monthly Price (USD)</Label>
                        <Input
                          placeholder="29.99"
                          {...register(`subscriptionTiers.${index}.price`)}
                        />
                        {errors.subscriptionTiers?.[index]?.price && (
                          <p className="text-sm text-red-500">
                            {errors.subscriptionTiers[index]?.price?.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Plan Description</Label>
                        <Textarea
                          placeholder="Describe the value members will get at this tier"
                          {...register(`subscriptionTiers.${index}.description`)}
                        />
                        {errors.subscriptionTiers?.[index]?.description && (
                          <p className="text-sm text-red-500">
                            {errors.subscriptionTiers[index]?.description?.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Features (one per line)</Label>
                        <Textarea
                          placeholder="Direct access to community discussions&#10;Weekly expert Q&A sessions&#10;Exclusive resources and content"
                          {...register(`subscriptionTiers.${index}.features`)}
                        />
                        {errors.subscriptionTiers?.[index]?.features && (
                          <p className="text-sm text-red-500">
                            {errors.subscriptionTiers[index]?.features?.message}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => append({
                      name: '',
                      description: '',
                      price: '',
                      features: '',
                    })}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Another Plan
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {error && (
              <Alert variant="destructive" className="mt-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <div className="flex w-full gap-4">
              {activeTab === 'tiers' && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setActiveTab('details')}
                >
                  Back to Details
                </Button>
              )}
              <Button
                type="submit"
                variant="gradient"
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Community...
                  </>
                ) : (
                  'Create Community'
                )}
              </Button>
            </div>
          </CardFooter>
        </div>
      </Card>
    </form>
  )
} 