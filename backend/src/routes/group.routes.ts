import { Router } from 'express';
import { supabase } from '../utils/supabase';
import { Group, GroupStatus } from '../types/database';
import { SlackService } from '../services/slack.service';
import { EmailService } from '../services/email.service';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();
const slackService = new SlackService();
const emailService = new EmailService();
const SLACK_WORKSPACE_INVITE = 'https://join.slack.com/t/groopie-workspace/shared_invite/zt-2dqr0xnxc-Ij~Hy~7mBBBXDzYKRXTYA';

// Get all groups
router.get('/', async (req, res) => {
  try {
    const { data: groups, error } = await supabase
      .from('groups')
      .select(`
        *,
        creator:auth.users(id, email, full_name),
        plans(*)
      `)
      .eq('status', 'active');

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ groups });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single group
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: group, error } = await supabase
      .from('groups')
      .select(`
        *,
        creator:auth.users(id, email, full_name),
        plans(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json({ group });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create group
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

    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const { data: group, error } = await supabase
      .from('groups')
      .insert({
        name,
        description,
        creator_id: user.id,
        status: 'pending' as GroupStatus
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ group });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update group
router.patch('/:id', async (req, res) => {
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

    // Check if user is creator or admin
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', id)
      .single();

    if (groupError || !group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.creator_id !== user.id) {
      const { data: userData } = await supabase
        .from('auth.users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!userData || userData.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    const { name, description, status } = req.body;
    const updates: Partial<Group> = {};

    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (status) updates.status = status;

    const { data: updatedGroup, error } = await supabase
      .from('groups')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ group: updatedGroup });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Invite to Slack channel
router.post('/:id/invite', async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Get group details
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', id)
      .single();

    if (groupError || !group) {
      console.error('Error fetching group:', groupError);
      return res.status(404).json({ error: 'Group not found' });
    }

    if (!group.slack_channel_id) {
      return res.status(400).json({ error: 'Group has no Slack channel' });
    }

    // Send Slack invite email
    await emailService.sendSlackInviteEmail(email, group);

    res.json({ message: 'Slack invite sent successfully' });
  } catch (error) {
    console.error('Error sending Slack invite:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 