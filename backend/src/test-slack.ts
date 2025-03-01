import { slackService } from './services/slack.service';
import { WebClient } from '@slack/web-api';

async function testSlackIntegration() {
  console.log('Testing Slack Integration...');

  try {
    // Test 0: Get Bot User ID
    const botClient = new WebClient(process.env.SLACK_BOT_TOKEN);
    const authTest = await botClient.auth.test();
    console.log('Bot User ID:', authTest.user_id);
    console.log('Bot Username:', authTest.user);

    // Test 1: Create a channel
    const channelName = `test-${Date.now()}`;
    console.log(`\nCreating channel: ${channelName}`);
    const channelId = await slackService.createChannel(channelName);
    console.log('Channel created successfully!');
    console.log('Channel ID:', channelId);
    console.log('Channel URL:', slackService.getChannelUrl(channelId));

    // Test 2: Invite a user
    // Replace this with an email that exists in your Slack workspace
    const testEmail = 'rdumasig@taxikel.com';
    console.log(`\nInviting user ${testEmail} to channel...`);
    await slackService.inviteToChannel(channelId, testEmail);
    console.log('User invited successfully!');

    console.log('\nAll tests passed! Check your Slack workspace.');
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testSlackIntegration(); 