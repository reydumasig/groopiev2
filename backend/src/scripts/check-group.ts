import { supabase } from '../utils/supabase';

async function checkGroup() {
  try {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('name', 'TXKL Users')
      .single();

    if (error) {
      console.error('Error fetching group:', error);
      return;
    }

    console.log('Group details:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

checkGroup(); 