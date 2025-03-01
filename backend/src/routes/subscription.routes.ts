import { Router } from 'express';
import { supabase } from '../utils/supabase';
import { SubscriptionStatus } from '../types/database';

const router = Router();

// Get subscription details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plan:plans(
          *,
          group:groups(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Check if user owns the subscription or is the group creator
    if (subscription.user_id !== user.id && 
        subscription.plan.group.creator_id !== user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json({ subscription });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create subscription
router.post('/', async (req, res) => {
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

    const { plan_id } = req.body;
    if (!plan_id) {
      return res.status(400).json({ error: 'Plan ID is required' });
    }

    // Check if plan exists and is from an active group
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*, group:groups(*)')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    if (plan.group.status !== 'active') {
      return res.status(400).json({ error: 'Group is not active' });
    }

    // Check if user already has an active subscription to this plan
    const { data: existingSub, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('plan_id', plan_id)
      .eq('status', 'active')
      .single();

    if (existingSub) {
      return res.status(400).json({ error: 'Active subscription already exists' });
    }

    // Create subscription (payment handling would be added here)
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan_id,
        status: 'incomplete' as SubscriptionStatus,
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ subscription });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel subscription
router.post('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get subscription and check ownership
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (subError || !subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    if (subscription.status === 'canceled') {
      return res.status(400).json({ error: 'Subscription is already canceled' });
    }

    // Cancel subscription (Stripe handling would be added here)
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'canceled' as SubscriptionStatus })
      .eq('id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Subscription canceled successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 