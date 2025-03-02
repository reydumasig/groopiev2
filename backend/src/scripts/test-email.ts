import { EmailService } from '../services/email.service';
import { supabase } from '../utils/supabase';
import { User } from '@supabase/supabase-js';
import { GroupStatus } from '../types/database';
import dotenv from 'dotenv';

dotenv.config();

const emailService = new EmailService();

async function testEmailService() {
  try {
    console.log('Starting email service test...');

    // Test 1: Welcome Email
    console.log('\nTest 1: Welcome Email');
    const testUser = {
      id: 'test-user-id',
      email: 'rey@taxikel.com',
      aud: 'authenticated',
      app_metadata: {},
      user_metadata: {
        full_name: 'Test User'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      role: undefined,
      confirmed_at: new Date().toISOString()
    } as unknown as User;

    await emailService.sendWelcomeEmail(testUser);
    console.log('Welcome email test completed');

    // Test 2: Group Approval Email
    console.log('\nTest 2: Group Approval Email');
    const testGroup = {
      id: 'test-group-id',
      name: 'Test Group',
      description: 'A test group for email service',
      status: 'pending' as GroupStatus,
      creator_id: 'test-user-id',
      slack_channel_id: null,
      slack_channel_name: null,
      slack_channel_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      users: {
        id: 'test-user-id',
        email: 'rey@taxikel.com',
        raw_user_meta_data: {
          full_name: 'Test User'
        }
      }
    };

    await emailService.sendGroupApprovalEmail(testGroup);
    console.log('Group approval email test completed');

    // Test 3: Slack Invite Email
    console.log('\nTest 3: Slack Invite Email');
    await emailService.sendSlackInviteEmail('rey@taxikel.com', testGroup);
    console.log('Slack invite email test completed');

    console.log('\nAll email tests completed successfully!');
  } catch (error) {
    console.error('Error testing email service:', error);
  }
}

testEmailService(); 