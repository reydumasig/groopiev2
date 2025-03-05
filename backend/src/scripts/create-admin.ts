import { supabase } from '../utils/supabase';

async function makeAdmin() {
  try {
    // Get user by email
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error getting users:', {
        message: authError?.message,
        details: authError,
      });
      throw authError;
    }

    const user = users.find(u => u.email === 'tech@joingroopie.com');
    if (!user) {
      throw new Error('User not found');
    }

    // Update user metadata to include role
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { 
        user_metadata: { role: 'admin' }
      }
    );

    if (updateError) {
      console.error('Error updating user metadata:', {
        message: updateError.message,
        details: updateError,
      });
      throw updateError;
    }

    // Also update the profile table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        role: 'admin',
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('Error updating profile:', {
        message: profileError.message,
        details: profileError,
      });
      throw profileError;
    }

    console.log('User role updated to admin successfully:', {
      id: user.id,
      email: user.email,
      metadata: {
        user_metadata: { role: 'admin' }
      }
    });
  } catch (error: any) {
    console.error('Error updating admin role:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
      details: error,
    });
  }
}

makeAdmin(); 