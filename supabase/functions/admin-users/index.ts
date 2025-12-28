import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'super_admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Super admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    if (req.method === 'GET') {
      return await listUsers(supabase, url);
    } else if (req.method === 'PATCH' && pathParts.length === 3) {
      return await updateUser(supabase, req, pathParts[2]);
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in admin-users:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function listUsers(supabase: any, url: URL) {
  const organizationId = url.searchParams.get('organization');
  const role = url.searchParams.get('role');
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = (page - 1) * limit;

  let query = supabase
    .from('profiles')
    .select('*, organization:organizations(name, subscription_plan)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }

  if (role) {
    query = query.eq('role', role);
  }

  const { data: users, error, count } = await query;

  if (error) {
    throw error;
  }

  return new Response(
    JSON.stringify({
      users: users || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function updateUser(supabase: any, req: Request, userId: string) {
  const body = await req.json();
  const { is_active, role } = body;

  const updates: any = {};
  if (is_active !== undefined) updates.is_active = is_active;
  if (role !== undefined) updates.role = role;

  const { data: updatedUser, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select('*, organization:organizations(name)')
    .single();

  if (error) {
    throw error;
  }

  await supabase.from('platform_activity_log').insert({
    action: 'update_user',
    target_type: 'user',
    target_id: userId,
    target_name: updatedUser.email,
    details: { updates },
  });

  return new Response(JSON.stringify(updatedUser), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}