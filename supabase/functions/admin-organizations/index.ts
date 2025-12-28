import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
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
      if (pathParts.length === 3 && pathParts[2]) {
        return await getOrganizationDetail(supabase, pathParts[2]);
      } else {
        return await listOrganizations(supabase, url);
      }
    } else if (req.method === 'PATCH' && pathParts.length === 3) {
      return await updateOrganization(supabase, req, pathParts[2]);
    } else if (req.method === 'POST' && pathParts.length === 4) {
      const orgId = pathParts[2];
      const action = pathParts[3];
      if (action === 'suspend') {
        return await suspendOrganization(supabase, orgId, user.id);
      } else if (action === 'reactivate') {
        return await reactivateOrganization(supabase, orgId, user.id);
      } else if (action === 'update-stats') {
        return await updateOrganizationStats(supabase, orgId);
      }
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in admin-organizations:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function listOrganizations(supabase: any, url: URL) {
  const status = url.searchParams.get('status');
  const plan = url.searchParams.get('plan');
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  let query = supabase.from('organizations').select('*', { count: 'exact' });

  if (status) {
    query = query.eq('subscription_status', status);
  }

  if (plan) {
    query = query.eq('subscription_plan', plan);
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data: organizations, error, count } = await query;

  if (error) {
    throw error;
  }

  return new Response(
    JSON.stringify({
      organizations: organizations || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getOrganizationDetail(supabase: any, orgId: string) {
  const [orgResult, usersResult, activityResult, ticketsResult] = await Promise.all([
    supabase.from('organizations').select('*').eq('id', orgId).single(),
    supabase.from('profiles').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }),
    supabase.from('activity_log').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(50),
    supabase.from('support_tickets').select('*').eq('organization_id', orgId).in('status', ['open', 'in_progress', 'waiting']),
  ]);

  if (orgResult.error) {
    throw orgResult.error;
  }

  return new Response(
    JSON.stringify({
      organization: orgResult.data,
      users: usersResult.data || [],
      recentActivity: activityResult.data || [],
      openTickets: ticketsResult.data || [],
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function updateOrganization(supabase: any, req: Request, orgId: string) {
  const body = await req.json();
  const { subscription_plan, subscription_status, max_users, max_items, trial_ends_at, mrr } = body;

  const updates: any = {};
  if (subscription_plan) updates.subscription_plan = subscription_plan;
  if (subscription_status) updates.subscription_status = subscription_status;
  if (max_users !== undefined) updates.max_users = max_users;
  if (max_items !== undefined) updates.max_items = max_items;
  if (trial_ends_at !== undefined) updates.trial_ends_at = trial_ends_at;
  if (mrr !== undefined) updates.mrr = mrr;

  const { data: organization, error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', orgId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  await supabase.from('platform_activity_log').insert({
    action: 'update_organization',
    target_type: 'organization',
    target_id: orgId,
    target_name: organization.name,
    details: { updates },
  });

  return new Response(JSON.stringify(organization), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function suspendOrganization(supabase: any, orgId: string, adminId: string) {
  const { error: orgError } = await supabase
    .from('organizations')
    .update({ subscription_status: 'cancelled' })
    .eq('id', orgId);

  if (orgError) {
    throw orgError;
  }

  const { error: usersError } = await supabase
    .from('profiles')
    .update({ is_active: false })
    .eq('organization_id', orgId);

  if (usersError) {
    throw usersError;
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', orgId)
    .single();

  await supabase.from('platform_activity_log').insert({
    action: 'suspend_organization',
    target_type: 'organization',
    target_id: orgId,
    target_name: org?.name,
  });

  return new Response(
    JSON.stringify({ success: true, message: 'Organization suspended' }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function reactivateOrganization(supabase: any, orgId: string, adminId: string) {
  const { error: orgError } = await supabase
    .from('organizations')
    .update({ subscription_status: 'active' })
    .eq('id', orgId);

  if (orgError) {
    throw orgError;
  }

  const { error: usersError } = await supabase
    .from('profiles')
    .update({ is_active: true })
    .eq('organization_id', orgId);

  if (usersError) {
    throw usersError;
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', orgId)
    .single();

  await supabase.from('platform_activity_log').insert({
    action: 'reactivate_organization',
    target_type: 'organization',
    target_id: orgId,
    target_name: org?.name,
  });

  return new Response(
    JSON.stringify({ success: true, message: 'Organization reactivated' }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function updateOrganizationStats(supabase: any, orgId: string) {
  const { error } = await supabase.rpc('update_organization_stats', { org_id: orgId });

  if (error) {
    throw error;
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single();

  return new Response(JSON.stringify(org), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}