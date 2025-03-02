import sgMail from '@sendgrid/mail';
import { User } from '@supabase/supabase-js';
import { Group } from '../types/database';
import dotenv from 'dotenv';

dotenv.config();

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

interface EmailTemplate {
  subject: string;
  html: string;
}

export class EmailService {
  private readonly fromEmail: string;
  private readonly templates: {
    welcome: (user: User) => EmailTemplate;
    groupApproval: (group: Group) => EmailTemplate;
    slackInvite: (group: Group) => EmailTemplate;
  };

  constructor() {
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL || 'support@joingroopie.com';
    this.templates = {
      welcome: (user: User) => ({
        subject: 'Welcome to Groopie! 🎉',
        html: `
          <h1>Welcome to Groopie!</h1>
          <p>Hi ${user.email},</p>
          <p>Thank you for joining Groopie! We're excited to have you on board.</p>
          <p>With Groopie, you can:</p>
          <ul>
            <li>Create and manage Slack communities</li>
            <li>Set up subscription tiers</li>
            <li>Connect with your audience</li>
          </ul>
          <p>Get started by creating your first group!</p>
          <p>Best regards,<br>The Groopie Team</p>
        `
      }),
      groupApproval: (group: Group) => ({
        subject: 'Your Groopie Group Has Been Approved! 🎉',
        html: `
          <h1>Your Group Has Been Approved!</h1>
          <p>Great news! Your group "${group.name}" has been approved and is now active.</p>
          <p>You can now:</p>
          <ul>
            <li>Access your Slack channel</li>
            <li>Invite members</li>
            <li>Start building your community</li>
          </ul>
          <p>Visit your group dashboard to get started!</p>
          <p>Best regards,<br>The Groopie Team</p>
        `
      }),
      slackInvite: (group: Group) => ({
        subject: `Join ${group.name} on Slack!`,
        html: `
          <h1>Welcome to ${group.name}! 🎉</h1>
          <p>You've been invited to join the Slack channel for ${group.name}.</p>
          <h2>Next Steps:</h2>
          <ol>
            <li>Join our Slack workspace using this invite link:<br>
              <a href="${process.env.SLACK_WORKSPACE_INVITE}">Click here to join the workspace</a>
            </li>
            <li>Once you've joined the workspace, your group's channel "#${group.slack_channel_name || ''}" will be ready for you.</li>
          </ol>
          <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
          <p>Best regards,<br>The Groopie Team</p>
        `
      })
    };
  }

  private async sendEmail(to: string, template: EmailTemplate): Promise<void> {
    try {
      console.log('Sending email to:', to);
      const msg = {
        to,
        from: this.fromEmail,
        subject: template.subject,
        html: template.html,
      };

      await sgMail.send(msg);
      console.log('Email sent successfully to:', to);
    } catch (error) {
      console.error('Error sending email:', {
        to,
        subject: template.subject,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  async sendWelcomeEmail(user: User): Promise<void> {
    await this.sendEmail(user.email!, this.templates.welcome(user));
  }

  async sendGroupApprovalEmail(group: Group): Promise<void> {
    if (!group.users?.email) {
      throw new Error('Group has no associated creator email');
    }
    await this.sendEmail(group.users.email, this.templates.groupApproval(group));
  }

  async sendSlackInviteEmail(email: string, group: Group): Promise<void> {
    await this.sendEmail(email, this.templates.slackInvite(group));
  }
} 