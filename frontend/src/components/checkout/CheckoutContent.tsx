'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

interface Plan {
  id: string
  name: string
  description: string
  price: number
  group: {
    id: string
    name: string
    description: string
  }
}

interface Props {
  planId: string
}

export function CheckoutContent({ planId }: Props) {
  const [plan, setPlan] = useState<Plan | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuthStore()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const { data, error } = await supabase
          .from('plans')
          .select(`
            *,
            group:groups (
              id,
              name,
              description
            )
          `)
          .eq('id', planId)
          .single()

        if (error) throw error
        setPlan(data)
      } catch (error) {
        console.error('Error fetching plan:', error)
        setError('Failed to load plan details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlan()
  }, [planId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !plan) return

    setIsProcessing(true)
    setError(null)

    try {
      // Create subscription with 'pending' status
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan_id: plan.id,
          status: 'pending',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single()

      if (subError) throw subError

      // Mock payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Update subscription to active
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({ status: 'active' })
        .eq('id', subscription.id)

      if (updateError) throw updateError

      // Create payment history record
      const { error: paymentError } = await supabase
        .from('payment_history')
        .insert({
          subscription_id: subscription.id,
          amount: plan.price,
          platform_fee: plan.price * 0.2,
          creator_share: plan.price * 0.8,
          status: 'completed'
        })

      if (paymentError) throw paymentError

      router.push(`/checkout/${planId}/success?subscription=${subscription.id}`)
    } catch (error) {
      console.error('Error processing payment:', error)
      setError('Failed to process payment. Please try again.')
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="py-10">
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertDescription>Plan not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Purchase</CardTitle>
            <CardDescription>
              Subscribe to {plan.group.name} - {plan.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Plan Details</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                <p className="text-2xl font-bold mt-2">${plan.price}/month</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="card">Card Number (Mock)</Label>
                  <Input
                    id="card"
                    placeholder="4242 4242 4242 4242"
                    required
                    pattern="\d{4}\s?\d{4}\s?\d{4}\s?\d{4}"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry (Mock)</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      required
                      pattern="\d{2}/\d{2}"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvc">CVC (Mock)</Label>
                    <Input
                      id="cvc"
                      placeholder="123"
                      required
                      pattern="\d{3}"
                    />
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </form>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={isProcessing}
              onClick={handleSubmit}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay $${plan.price}`
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 