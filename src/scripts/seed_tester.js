import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://scsbermcpukyxfwcuvls.supabase.co';
const serviceRoleKey = 'sb_secret_oJ5NVQZWXUegZmlFFanIcg_nxdv90wD';
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createTestAdminUser() {
  console.log('Attempting to create seed user explicitly by bypassing Rate Limits...');
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: 'tester@gamedeals.com',
    password: 'password12345',
    email_confirm: true,
    user_metadata: {
      full_name: 'Robot Tester',
      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=tester',
    },
  });

  if (error) {
    if (error.status === 422 && error.message.includes('already registered')) {
      console.log('User already exists, the credentials tester@gamedeals.com are safe to use.');
      process.exit(0);
    }
    console.error('Error creating user via admin API:', error.message);
    process.exit(1);
  } else {
    console.log('Admin User created successfully:', data.user?.id);
    console.log('Email confirmed:', data.user?.email_confirmed_at != null);
  }
}

createTestAdminUser();
