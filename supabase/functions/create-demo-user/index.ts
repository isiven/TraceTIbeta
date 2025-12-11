import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Parse request body
    const { email, password, fullName, companyName, accountType } = await req.json();

    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Create user in auth
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || 'Demo User',
        company_name: companyName || 'Demo Company',
        account_type: accountType || 'end_user'
      }
    });

    if (userError) throw userError;
    if (!userData.user) throw new Error('User creation failed');

    const userId = userData.user.id;

    // Create organization
    const { data: orgData, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        name: companyName || 'Demo Company',
        account_type: accountType || 'end_user',
        subscription_plan: 'free',
        subscription_status: 'active',
        max_users: 5,
        max_assets: 50,
        owner_id: userId,
      })
      .select()
      .single();

    if (orgError) throw orgError;

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email: email,
        full_name: fullName || 'Demo User',
        organization_id: orgData.id,
        role: 'admin',
        scope: 'all',
        account_type: accountType || 'end_user',
        is_active: true,
        auth_provider: 'email',
      });

    if (profileError) throw profileError;

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userId,
          email: email,
          organization_id: orgData.id,
        },
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error creating demo user:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});