import { supabase } from '../utils/supabase';
import { slackService } from '../services/slack.service';

async function fixGroupSlack() {
  try {
    // Get the group
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('name', 'TXKL Users')
      .single();

    if (groupError || !group) {
      console.error('Error fetching group:', groupError);
      return;
    }

    console.log('Found group:', group);

    // Try to find existing channel first
    const normalizedName = slackService.normalizeChannelName(group.name);
    console.log('Looking for existing channel:', normalizedName);
    
    let channelId;
    try {
      channelId = await slackService.getChannelIdByName(normalizedName);
      console.log('Found existing channel:', channelId);
    } catch (findError) {
      // If channel doesn't exist, create it
      console.log('No existing channel found, creating new one...');
      channelId = await slackService.createChannel(group.name);
    }

    // Update group with Slack information
    console.log('Updating group with Slack details...');
    const { error: updateError } = await supabase
      .from('groups')
      .update({
        slack_channel_id: channelId,
        slack_channel_name: normalizedName,
        status: 'active'
      })
      .eq('id', group.id);

    if (updateError) {
      console.error('Error updating group:', updateError);
      return;
    }

    console.log('Successfully updated group with Slack details:', {
      channelId,
      normalizedName
    });

    // Send invite to rey@taxikel.com
    console.log('Sending Slack invite...');
    await slackService.inviteToChannel(channelId, 'rey@taxikel.com');
    console.log('Slack invite sent successfully');

  } catch (error) {
    console.error('Error:', error);
  }
}

fixGroupSlack(); 