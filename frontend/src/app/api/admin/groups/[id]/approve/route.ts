import { createClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // Get the authorization header from the incoming request
    const authorization = request.headers.get('authorization');

    if (!authorization) {
      console.log('No authorization header provided');
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const supabase = createClient();
    
    // Get the session to verify admin status
    const { data: { user }, error: authError } = await supabase.auth.getUser(authorization.replace('Bearer ', ''));
    if (authError || !user) {
      console.log('User authentication failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role in user metadata
    if (!user.user_metadata?.role || user.user_metadata.role !== 'admin') {
      console.log('User is not an admin:', user.user_metadata);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = context.params;
    console.log('Processing approval for group:', id);

    // Forward the request to the backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    console.log('Forwarding request to backend:', `${backendUrl}/api/admin/groups/${id}/approve`);
    
    const response = await fetch(`${backendUrl}/api/admin/groups/${id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization
      }
    });

    if (!response.ok) {
      const error = await response.json();
      console.log('Backend request failed:', error);
      return NextResponse.json(error, { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error approving group:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 