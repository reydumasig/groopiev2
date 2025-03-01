import { Router } from 'express';
import { supabase } from '../utils/supabase';
import { UserRole } from '../types/database';

const router = Router();

// Get current user profile
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user role
router.patch('/role', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { role } = req.body;
    if (!role || !['subscriber', 'creator'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const { error: updateError } = await supabase
      .from('auth.users')
      .update({ role })
      .eq('id', user.id);

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    res.json({ message: 'Role updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's subscriptions
router.get('/subscriptions', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plan:plans(
          *,
          group:groups(*)
        )
      `)
      .eq('user_id', user.id);

    if (subError) {
      return res.status(400).json({ error: subError.message });
    }

    res.json({ subscriptions });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 