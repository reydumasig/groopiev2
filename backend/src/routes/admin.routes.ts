import { Router } from 'express';
import { supabase } from '../utils/supabase';
import { isAdmin } from '../middleware/auth';
import { SlackService } from '../services/slack.service';
import { EmailService } from '../services/email.service';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();
const slackService = new SlackService();
const emailService = new EmailService();
const SLACK_WORKSPACE_INVITE = 'https://join.slack.com/t/groopie-workspace/shared_invite/zt-2dqr0xnxc-Ij~Hy~7mBBBXDzYKRXTYA';

// Middleware to check if user is admin
async function isAdmin(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.log('Auth error or no user:', authError);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check admin role in user metadata
    const isAdminInMetadata = user.user_metadata?.role === 'admin';
    
    if (!isAdminInMetadata) {
      console.log('User is not admin:', {
        user_metadata: user.user_metadata
      });
      return res.status(403).json({ error: 'Forbidden' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Error in isAdmin middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get pending groups
router.get('/groups/pending', isAdmin, async (req, res) => {
  try {
    console.log('Fetching pending groups...');
    const { data: groups, error } = await supabase
      .from('groups')
      .select(`
        *,
        users (
          id,
          email,
          raw_user_meta_data
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending groups:', error);
      throw error;
    }

    console.log('Found pending groups:', groups?.length || 0);
    res.json({ groups });
  } catch (error) {
    console.error('Error in pending groups endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Set up email transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Approve group and set up Slack
router.post('/groups/:id/approve', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Get group with creator info
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select(`
        *,
        users!inner (
          id,
          email,
          raw_user_meta_data
        )
      `)
      .eq('id', id)
      .single();

    if (groupError) {
      return res.status(400).json({ error: groupError.message });
    }

    // Update group status
    const { error: updateError } = await supabase
      .from('groups')
      .update({ status: 'active' })
      .eq('id', id);

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    // Send approval email
    await emailService.sendGroupApprovalEmail(group);

    // Try to update Slack details if we have them
    if (!group.slack_channel_id) {
      try {
        console.log(`Attempting to find or create Slack channel for group: ${group.name}`);
        const normalizedName = slackService.normalizeChannelName(group.name);
        let channelId;
        
        try {
          // First try to find existing channel
          channelId = await slackService.getChannelIdByName(normalizedName);
          console.log('Found existing Slack channel:', channelId);
        } catch (findError) {
          // If channel doesn't exist, create it
          console.log('No existing channel found, creating new one...');
          channelId = await slackService.createChannel(group.name);
        }

        if (channelId) {
          // Try to update Slack details, but don't fail if it doesn't work
          const { error: slackUpdateError } = await supabase
            .from('groups')
            .update({
              slack_channel_id: channelId,
              slack_channel_name: normalizedName,
              slack_channel_url: `https://app.slack.com/client/T08F9JLQWJW/${channelId}`
            })
            .eq('id', id);

          if (slackUpdateError) {
            console.warn('Could not update Slack details, but group is approved:', slackUpdateError);
          }
        }
      } catch (slackError) {
        console.error('Error setting up Slack channel:', slackError);
      }
    }

    res.json({ message: 'Group approved successfully' });
  } catch (error) {
    console.error('Error approving group:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reject group
router.post('/groups/:id/reject', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const { error } = await supabase
      .from('groups')
      .update({
        status: 'suspended'
      })
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Group rejected' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 