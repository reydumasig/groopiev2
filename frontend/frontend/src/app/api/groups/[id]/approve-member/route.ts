import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params
    const { email, subscriptionId } = await request.json()

    if (!email || !subscriptionId) {
      return NextResponse.json(
        { error: 'Email and subscription ID are required' },
        { status: 400 }
      )
    }

    // Forward the request to the backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
    console.log('Forwarding member approval request to backend:', {
      url: `${backendUrl}/api/groups/${id}/approve-member`,
      email,
      subscriptionId
    })
    
    const response = await fetch(`${backendUrl}/api/groups/${id}/approve-member`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, subscriptionId }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.log('Backend request failed:', error)
      return NextResponse.json(error, { status: response.status })
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error approving member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 