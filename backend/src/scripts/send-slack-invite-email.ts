import { supabase } from '../utils/supabase';
import { slackService } from '../services/slack.service';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const SLACK_WORKSPACE_INVITE = 'https://join.slack.com/t/groopie-workspace/shared_invite/zt-2dqr0xnxc-Ij~Hy~7mBBBXDzYKRXTYA';

async function sendSlackInviteEmail() {
  try {
    // Get the group and its creator's email
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select(`
        *,
        users!inner (
          email,
          raw_user_meta_data
        )
      `)
      .eq('name', 'TXKL Users')
      .single();

    if (groupError || !group) {
      console.error('Error fetching group:', groupError);
      return;
    }

    console.log('Found group:', group);

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

    // Send the email
    const info = await transporter.sendMail({
      from: '"Groopie Support" <support@joingroopie.com>',
      to: group.users.email,
      subject: 'Your Groopie Group Has Been Approved!',
      html: `
        <h1>Your Group Has Been Approved! 🎉</h1>
        <p>Great news! Your group "${group.name}" has been approved and is now active.</p>
        
        <h2>Next Steps:</h2>
        <ol>
          <li>Join our Slack workspace using this invite link:<br>
            <a href="${SLACK_WORKSPACE_INVITE}">${SLACK_WORKSPACE_INVITE}</a>
          </li>
          <li>Once you've joined the workspace, your group's channel "#${group.slack_channel_name}" will be ready for you.</li>
        </ol>

        <p>If you have any questions or need assistance, please don't hesitate to contact us at support@joingroopie.com</p>

        <p>Best regards,<br>The Groopie Team</p>
      `
    });

    console.log('Email sent successfully:', {
      messageId: info.messageId,
      to: group.users.email
    });

  } catch (error) {
    console.error('Error sending email:', error);
  }
}

sendSlackInviteEmail(); 