import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Plan {
  id: string
  name: string
  description: string
  price: number
  features: string[]
}

interface Group {
  id: string
  name: string
  description: string
  slack_channel_url: string | null
  whatsapp_group_url: string | null
  group_type: 'slack' | 'whatsapp'
  plans: Plan[]
}

const subscriptionTierSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  price: z.string().min(1, 'Price is required').regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format'),
  description: z.string().min(1, 'Description is required'),
  features: z.string().min(1, 'Features are required'),
})

const formSchema = z.object({
  name: z.string().min(3, 'Group name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  slack_channel_url: z.string().url('Please enter a valid Slack channel URL').optional().nullable(),
  whatsapp_group_url: z.string().url('Please enter a valid WhatsApp group URL').optional().nullable(),
  group_type: z.enum(['slack', 'whatsapp']),
  subscriptionTiers: z.array(subscriptionTierSchema).min(1, 'At least one subscription tier is required'),
})

type FormData = z.infer<typeof formSchema>

interface GroupSettingsProps {
  group: Group
  onUpdate: () => void
}

export function GroupSettings({ group, onUpdate }: GroupSettingsProps) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('details')
  const supabase = createClient()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: group.name,
      description: group.description,
      slack_channel_url: group.slack_channel_url,
      whatsapp_group_url: group.whatsapp_group_url,
      group_type: group.group_type,
      subscriptionTiers: group.plans.map(plan => ({
        id: plan.id,
        name: plan.name,
        price: plan.price.toString(),
        description: plan.description,
        features: Array.isArray(plan.features) ? plan.features.join('\n') : ''
      })),
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'subscriptionTiers',
  })

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true)
      setError(null)

      // Update group details
      const { error: groupError } = await supabase
        .from('groups')
        .update({
          name: data.name,
          description: data.description,
          slack_channel_url: data.group_type === 'slack' ? data.slack_channel_url : null,
          whatsapp_group_url: data.group_type === 'whatsapp' ? data.whatsapp_group_url : null,
          group_type: data.group_type,
          updated_at: new Date().toISOString()
        })
        .eq('id', group.id)

      if (groupError) throw groupError

      // Update existing plans and create new ones
      const planPromises = data.subscriptionTiers.map(async tier => {
        const planData = {
          group_id: group.id,
          name: tier.name,
          description: tier.description,
          price: parseFloat(tier.price),
          features: tier.features.split('\n').map(f => f.trim()),
          updated_at: new Date().toISOString()
        }

        if (tier.id) {
          // Update existing plan
          return supabase
            .from('plans')
            .update(planData)
            .eq('id', tier.id)
        } else {
          // Create new plan
          return supabase
            .from('plans')
            .insert({
              ...planData,
              created_at: new Date().toISOString()
            })
        }
      })

      const results = await Promise.all(planPromises)
      const planError = results.find(result => result.error)
      
      if (planError) throw planError

      onUpdate()
    } catch (error) {
      console.error('Error updating group:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Group Details</TabsTrigger>
          <TabsTrigger value="tiers">Subscription Tiers</TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit(onSubmit)}>
          <TabsContent value="details">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Group Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your group name"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your group"
                    {...register('description')}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Group Type</Label>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="slack"
                        value="slack"
                        {...register('group_type')}
                        defaultChecked={group.group_type === 'slack'}
                      />
                      <Label htmlFor="slack">Slack</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="whatsapp"
                        value="whatsapp"
                        {...register('group_type')}
                        defaultChecked={group.group_type === 'whatsapp'}
                      />
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                    </div>
                  </div>
                </div>

                {watch('group_type') === 'slack' && (
                  <div className="space-y-2">
                    <Label htmlFor="slack_channel_url">Slack Channel URL (Optional)</Label>
                    <Input
                      id="slack_channel_url"
                      placeholder="https://app.slack.com/client/..."
                      {...register('slack_channel_url')}
                    />
                    {errors.slack_channel_url && (
                      <p className="text-sm text-red-500">
                        {errors.slack_channel_url.message}
                      </p>
                    )}
                  </div>
                )}

                {watch('group_type') === 'whatsapp' && (
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp_group_url">WhatsApp Group URL</Label>
                    <Input
                      id="whatsapp_group_url"
                      placeholder="https://chat.whatsapp.com/..."
                      {...register('whatsapp_group_url')}
                    />
                    {errors.whatsapp_group_url && (
                      <p className="text-sm text-red-500">
                        {errors.whatsapp_group_url.message}
                      </p>
                    )}
                  </div>
                )}

                <Button
                  type="button"
                  onClick={() => setActiveTab('tiers')}
                >
                  Next: Edit Tiers
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tiers">
            <Card>
              <CardContent className="space-y-6 pt-6">
                {fields.map((field, index) => (
                  <div key={field.id} className="space-y-4 p-4 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">
                        Tier {index + 1}
                      </h3>
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => remove(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Tier Name</Label>
                        <Input
                          placeholder="e.g., Basic, Pro, Enterprise"
                          {...register(`subscriptionTiers.${index}.name`)}
                        />
                        {errors.subscriptionTiers?.[index]?.name && (
                          <p className="text-sm text-red-500">
                            {errors.subscriptionTiers[index]?.name?.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Price</Label>
                        <Input
                          placeholder="Enter price in USD"
                          {...register(`subscriptionTiers.${index}.price`)}
                        />
                        {errors.subscriptionTiers?.[index]?.price && (
                          <p className="text-sm text-red-500">
                            {errors.subscriptionTiers[index]?.price?.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          placeholder="Describe this tier"
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
                          placeholder="List the features for this tier"
                          {...register(`subscriptionTiers.${index}.features`)}
                        />
                        {errors.subscriptionTiers?.[index]?.features && (
                          <p className="text-sm text-red-500">
                            {errors.subscriptionTiers[index]?.features?.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append({ name: '', price: '', description: '', features: '' })}
                >
                  Add Another Tier
                </Button>

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab('details')}
                  >
                    Back to Details
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving Changes...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </form>
      </Tabs>
    </div>
  )
} 