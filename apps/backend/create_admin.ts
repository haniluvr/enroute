import { supabaseAdmin } from './src/config/supabase';

async function createAdminUser() {
  const email = 'admin@gmail.com';
  const password = 'admin123';

  console.log(`Setting up admin account for: ${email}`);

  // Try to create the user
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true, // Auto-confirm the email
  });

  if (error) {
    if (error.message.includes('already been registered')) {
        console.log(`User ${email} already exists. Updating password...`);
        // If they exist, update their password to ensure it is correct
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = usersData.users.find(u => u.email === email);
        if (existingUser) {
           await supabaseAdmin.auth.admin.updateUserById(existingUser.id, { password: password });
           console.log(`Password updated successfully for ${email}.`);
        }
    } else {
      console.error('Failed to create admin user:', error);
    }
  } else {
    console.log('Successfully created admin user:', data.user.id);
  }
}

createAdminUser();
