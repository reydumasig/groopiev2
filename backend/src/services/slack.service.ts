import { WebClient } from '@slack/web-api';
import dotenv from 'dotenv';

dotenv.config();

export class SlackService {
  private botClient: WebClient;
  private userClient: WebClient;
  private botUserId: string;

  constructor() {
    if (!process.env.SLACK_BOT_TOKEN || !process.env.SLACK_USER_TOKEN) {
      throw new Error('Missing required Slack environment variables');
    }

    this.botClient = new WebClient(process.env.SLACK_BOT_TOKEN);
    this.userClient = new WebClient(process.env.SLACK_USER_TOKEN);
    this.botUserId = process.env.SLACK_BOT_USER_ID || '';
  }

  /**
   * Creates a public Slack channel for a group
   */
  async createChannel(groupName: string): Promise<string> {
    try {
      console.log('Starting Slack channel creation process...');
      
      // Normalize channel name to meet Slack's requirements
      const normalizedName = this.normalizeChannelName(groupName);
      console.log('Normalized channel name:', {
        original: groupName,
        normalized: normalizedName
      });

      // Create public channel using bot token (has channels:manage scope)
      console.log('Creating Slack channel...');
      const result = await this.botClient.conversations.create({
        name: normalizedName,
        is_private: false,
      });

      if (!result.ok || !result.channel?.id) {
        console.error('Failed to create Slack channel:', {
          error: result.error,
          groupName,
          normalizedName
        });
        throw new Error('Failed to create Slack channel');
      }

      const channelId = result.channel.id;
      console.log('Slack channel created:', {
        channelId,
        channelName: normalizedName
      });

      // Set channel topic
      console.log('Setting channel topic...');
      const topicResult = await this.botClient.conversations.setTopic({
        channel: channelId,
        topic: `Groopie community channel for ${groupName}`,
      });

      if (!topicResult.ok) {
        console.warn('Failed to set channel topic:', {
          error: topicResult.error,
          channelId
        });
      }

      // Add tech@joingroopie.com as admin
      console.log('Looking up tech@joingroopie.com user...');
      try {
        const adminResult = await this.botClient.users.lookupByEmail({
          email: 'tech@joingroopie.com'
        });

        if (adminResult.ok && adminResult.user?.id) {
          console.log('Found tech@joingroopie.com user:', {
            userId: adminResult.user.id
          });

          // Invite the admin user
          console.log('Inviting tech@joingroopie.com to channel...');
          const inviteResult = await this.botClient.conversations.invite({
            channel: channelId,
            users: adminResult.user.id
          });

          if (!inviteResult.ok) {
            console.error('Failed to invite tech@joingroopie.com:', {
              error: inviteResult.error,
              channelId
            });
          } else {
            console.log('Successfully invited tech@joingroopie.com to the channel');
          }

          // Note: Making a user an admin requires Workspace Owner/Admin privileges
          console.log('Note: Please make tech@joingroopie.com an admin of the channel through the Slack UI');
        } else {
          console.error('Could not find tech@joingroopie.com user in Slack workspace:', {
            error: adminResult.error
          });
        }
      } catch (adminError) {
        console.error('Error adding tech@joingroopie.com:', {
          error: adminError instanceof Error ? adminError.message : adminError,
          channelId
        });
      }

      return channelId;
    } catch (error) {
      console.error('Error creating Slack channel:', {
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack
        } : error,
        groupName
      });
      throw new Error(`Failed to create Slack channel: ${(error as Error).message}`);
    }
  }

  /**
   * Invites a user to a channel
   */
  async inviteToChannel(channelId: string, email: string): Promise<boolean> {
    try {
      console.log(`Starting invite process for ${email} to channel ${channelId}...`);

      // First, look up the user by email using bot token (has users:read.email scope)
      console.log('Looking up user by email...');
      const userResult = await this.botClient.users.lookupByEmail({
        email: email,
      });

      if (!userResult.ok || !userResult.user?.id) {
        console.error('User not found in Slack workspace:', {
          error: userResult.error,
          email
        });
        throw new Error('User not found in Slack workspace');
      }

      console.log('Found user:', {
        userId: userResult.user.id,
        email
      });

      // Invite the user to the channel using bot token (has channels:manage scope)
      console.log('Inviting user to channel...');
      const inviteResult = await this.botClient.conversations.invite({
        channel: channelId,
        users: userResult.user.id,
      });

      if (!inviteResult.ok) {
        console.error('Failed to invite user:', {
          error: inviteResult.error,
          channelId,
          userId: userResult.user.id
        });
        throw new Error(`Failed to invite user: ${inviteResult.error}`);
      }

      // Send welcome message using bot token (has chat:write scope)
      console.log('Sending welcome message...');
      const messageResult = await this.botClient.chat.postMessage({
        channel: channelId,
        text: `Welcome to the channel, <@${userResult.user.id}>! 👋`,
      });

      if (!messageResult.ok) {
        console.warn('Failed to send welcome message:', {
          error: messageResult.error,
          channelId,
          userId: userResult.user.id
        });
      }

      console.log('Successfully completed invite process:', {
        channelId,
        email,
        userId: userResult.user.id
      });

      return true;
    } catch (error) {
      console.error('Error inviting user to Slack channel:', {
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack
        } : error,
        channelId,
        email
      });
      throw new Error(`Failed to invite user: ${(error as Error).message}`);
    }
  }

  /**
   * Gets the channel URL
   */
  getChannelUrl(channelId: string): string {
    return `https://slack.com/app_redirect?channel=${channelId}`;
  }

  /**
   * Normalizes a channel name to meet Slack's requirements
   * - Lowercase
   * - No spaces or special characters except hyphens and underscores
   * - Max 80 characters
   * - Must start with a letter or number
   */
  public normalizeChannelName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-') // Replace invalid chars with hyphen
      .replace(/^[^a-z0-9]/, 'g') // Ensure starts with letter/number
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .slice(0, 80); // Max 80 chars
  }

  /**
   * Gets a channel ID by its name
   */
  async getChannelIdByName(normalizedName: string): Promise<string> {
    try {
      console.log('Looking up channel by name:', normalizedName);
      
      // List all channels and find the matching one
      const result = await this.botClient.conversations.list({
        exclude_archived: true,
        types: 'public_channel'
      });

      if (!result.ok || !result.channels) {
        throw new Error('Failed to list channels');
      }

      const channel = result.channels.find(
        (c: any) => c.name === normalizedName
      );

      if (!channel || !channel.id) {
        throw new Error(`Channel ${normalizedName} not found`);
      }

      console.log('Found channel:', {
        name: normalizedName,
        id: channel.id
      });

      return channel.id;
    } catch (error) {
      console.error('Error getting channel ID by name:', {
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack
        } : error,
        channelName: normalizedName
      });
      throw new Error(`Failed to get channel ID: ${(error as Error).message}`);
    }
  }
}

export const slackService = new SlackService(); 