import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [orgsData, usersData, ticketsData, subscriptionsData, lastMonthMRR] = await Promise.all([
      supabase.from('organizations').select('*'),
      supabase.from('profiles').select('*'),
      supabase.from('support_tickets').select('*'),
      supabase.from('subscriptions').select('*'),
      supabase.from('subscriptions')
        .select('amount')
        .eq('status', 'active')
        .lte('created_at', lastMonthEnd.toISOString())
    ]);

    const organizations = orgsData.data || [];
    const users = usersData.data || [];
    const tickets = ticketsData.data || [];
    const subscriptions = subscriptionsData.data || [];

    const totalOrganizations = organizations.length;
    const activeOrganizations = organizations.filter(
      (org: any) => org.subscription_status === 'active'
    ).length;
    const trialOrganizations = organizations.filter(
      (org: any) => org.subscription_status === 'trial' || org.subscription_plan === 'free'
    ).length;

    const totalUsers = users.length;
    const newUsersThisMonth = users.filter(
      (user: any) => new Date(user.created_at) >= firstDayOfMonth
    ).length;

    const mrr = subscriptions
      .filter((sub: any) => sub.status === 'active')
      .reduce((sum: number, sub: any) => {
        const amount = parseFloat(sub.amount) || 0;
        return sum + (sub.interval === 'yearly' ? amount / 12 : amount);
      }, 0);

    const lastMonthMRRValue = (lastMonthMRR.data || []).reduce((sum: number, sub: any) => {
      const amount = parseFloat(sub.amount) || 0;
      return sum + amount;
    }, 0);

    const mrrGrowth = lastMonthMRRValue > 0
      ? ((mrr - lastMonthMRRValue) / lastMonthMRRValue) * 100
      : 0;

    const cancelledThisMonth = subscriptions.filter(
      (sub: any) => sub.cancelled_at && new Date(sub.cancelled_at) >= firstDayOfMonth
    ).length;
    const activeStartOfMonth = subscriptions.filter(
      (sub: any) => sub.created_at < firstDayOfMonth.toISOString() && sub.status === 'active'
    ).length;
    const churnRate = activeStartOfMonth > 0 ? (cancelledThisMonth / activeStartOfMonth) * 100 : 0;

    const arpu = activeOrganizations > 0 ? mrr / activeOrganizations : 0;

    const totalTickets = tickets.length;
    const openTickets = tickets.filter(
      (ticket: any) => ['open', 'in_progress', 'waiting'].includes(ticket.status)
    ).length;

    const resolvedTickets = tickets.filter(
      (ticket: any) => ticket.resolved_at !== null
    );
    const avgResponseTime = resolvedTickets.length > 0
      ? resolvedTickets.reduce((sum: number, ticket: any) => {
          const created = new Date(ticket.created_at).getTime();
          const resolved = new Date(ticket.resolved_at).getTime();
          return sum + (resolved - created);
        }, 0) / resolvedTickets.length / (1000 * 60 * 60)
      : 0;

    const metrics = {
      totalOrganizations,
      activeOrganizations,
      trialOrganizations,
      totalUsers,
      newUsersThisMonth,
      mrr: Math.round(mrr * 100) / 100,
      mrrGrowth: Math.round(mrrGrowth * 100) / 100,
      churnRate: Math.round(churnRate * 100) / 100,
      arpu: Math.round(arpu * 100) / 100,
      totalTickets,
      openTickets,
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
    };

    return new Response(JSON.stringify(metrics), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in super-admin-metrics:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});