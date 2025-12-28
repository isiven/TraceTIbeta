import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

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

    const { data: organizations, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name, last_activity_at, created_at');

    if (orgsError) {
      throw orgsError;
    }

    const results = [];
    const now = new Date();

    for (const org of organizations || []) {
      try {
        let activityScore = 0;
        let loginScore = 0;
        let ticketScore = 0;

        const lastActivity = org.last_activity_at
          ? new Date(org.last_activity_at)
          : new Date(org.created_at);
        const daysSinceActivity = Math.floor(
          (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceActivity <= 1) {
          activityScore = 40;
        } else if (daysSinceActivity <= 7) {
          activityScore = 30;
        } else if (daysSinceActivity <= 30) {
          activityScore = 20;
        } else if (daysSinceActivity <= 90) {
          activityScore = 10;
        } else {
          activityScore = 0;
        }

        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { count: activeUsersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id)
          .eq('is_active', true)
          .gte('last_login', sevenDaysAgo.toISOString());

        if ((activeUsersCount || 0) >= 3) {
          loginScore = 30;
        } else if ((activeUsersCount || 0) === 2) {
          loginScore = 20;
        } else if ((activeUsersCount || 0) === 1) {
          loginScore = 10;
        } else {
          loginScore = 0;
        }

        const ninetyDaysAgo = new Date(now);
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const { data: tickets } = await supabase
          .from('support_tickets')
          .select('status')
          .eq('organization_id', org.id)
          .gte('created_at', ninetyDaysAgo.toISOString());

        const totalTickets = tickets?.length || 0;

        if (totalTickets === 0) {
          ticketScore = 30;
        } else {
          const openTickets = tickets?.filter((t: any) =>
            ['open', 'in_progress', 'waiting'].includes(t.status)
          ).length || 0;
          const resolvedTickets = totalTickets - openTickets;
          const resolvedRatio = resolvedTickets / totalTickets;

          if (resolvedRatio >= 0.9) {
            ticketScore = 30;
          } else if (resolvedRatio >= 0.7) {
            ticketScore = 20;
          } else if (resolvedRatio >= 0.5) {
            ticketScore = 10;
          } else {
            ticketScore = 0;
          }
        }

        const healthScore = activityScore + loginScore + ticketScore;

        const { error: updateError } = await supabase
          .from('organizations')
          .update({ health_score: healthScore })
          .eq('id', org.id);

        if (updateError) {
          console.error(`Error updating health score for ${org.name}:`, updateError);
        }

        results.push({
          organization_id: org.id,
          organization_name: org.name,
          health_score: healthScore,
          breakdown: {
            activity: activityScore,
            logins: loginScore,
            tickets: ticketScore,
          },
        });
      } catch (error) {
        console.error(`Error processing organization ${org.name}:`, error);
        results.push({
          organization_id: org.id,
          organization_name: org.name,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in calculate-health-scores:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});