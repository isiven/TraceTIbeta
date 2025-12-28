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
      .select('*, organization:organizations(*)')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isSuperAdmin = profile.role === 'super_admin';
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    if (req.method === 'GET') {
      if (pathParts.length === 3 && pathParts[2]) {
        return await getTicketDetail(supabase, pathParts[2], profile, isSuperAdmin);
      } else {
        return await listTickets(supabase, url, profile, isSuperAdmin);
      }
    } else if (req.method === 'POST') {
      if (pathParts.length === 4 && pathParts[3] === 'messages') {
        return await addMessage(supabase, req, pathParts[2], profile, isSuperAdmin);
      } else {
        return await createTicket(supabase, req, profile);
      }
    } else if (req.method === 'PATCH' && pathParts.length === 3) {
      return await updateTicket(supabase, req, pathParts[2], isSuperAdmin);
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in support-tickets:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function listTickets(supabase: any, url: URL, profile: any, isSuperAdmin: boolean) {
  const status = url.searchParams.get('status');
  const priority = url.searchParams.get('priority');
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  let query = supabase.from('support_tickets').select('*', { count: 'exact' });

  if (!isSuperAdmin) {
    query = query.eq('organization_id', profile.organization_id);
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (priority) {
    query = query.eq('priority', priority);
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data: tickets, error, count } = await query;

  if (error) {
    throw error;
  }

  return new Response(
    JSON.stringify({
      tickets: tickets || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getTicketDetail(supabase: any, ticketId: string, profile: any, isSuperAdmin: boolean) {
  const { data: ticket, error: ticketError } = await supabase
    .from('support_tickets')
    .select('*, organization:organizations(*)')
    .eq('id', ticketId)
    .single();

  if (ticketError) {
    throw ticketError;
  }

  if (!isSuperAdmin && ticket.organization_id !== profile.organization_id) {
    return new Response(
      JSON.stringify({ error: 'Forbidden' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  let messagesQuery = supabase
    .from('ticket_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  if (!isSuperAdmin) {
    messagesQuery = messagesQuery.eq('is_internal', false);
  }

  const { data: messages, error: messagesError } = await messagesQuery;

  if (messagesError) {
    throw messagesError;
  }

  return new Response(
    JSON.stringify({
      ticket,
      messages: messages || [],
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function createTicket(supabase: any, req: Request, profile: any) {
  const body = await req.json();
  const { subject, description, category, priority } = body;

  if (!subject || !description) {
    return new Response(
      JSON.stringify({ error: 'Subject and description are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { data: ticket, error } = await supabase
    .from('support_tickets')
    .insert({
      organization_id: profile.organization_id,
      user_id: profile.id,
      user_email: profile.email,
      user_name: profile.full_name || profile.email,
      subject,
      description,
      category: category || 'other',
      priority: priority || 'medium',
      status: 'open',
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  await supabase.from('activity_log').insert({
    organization_id: profile.organization_id,
    user_id: profile.id,
    action: 'create_ticket',
    entity_type: 'ticket',
    entity_id: ticket.id,
    entity_name: subject,
  });

  return new Response(JSON.stringify(ticket), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function updateTicket(supabase: any, req: Request, ticketId: string, isSuperAdmin: boolean) {
  if (!isSuperAdmin) {
    return new Response(
      JSON.stringify({ error: 'Forbidden: Only super admins can update tickets' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const body = await req.json();
  const { status, priority, assigned_to } = body;

  const updates: any = {};
  if (status) updates.status = status;
  if (priority) updates.priority = priority;
  if (assigned_to !== undefined) updates.assigned_to = assigned_to;

  if (status === 'resolved' || status === 'closed') {
    updates.resolved_at = new Date().toISOString();
  }

  const { data: ticket, error } = await supabase
    .from('support_tickets')
    .update(updates)
    .eq('id', ticketId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return new Response(JSON.stringify(ticket), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function addMessage(supabase: any, req: Request, ticketId: string, profile: any, isSuperAdmin: boolean) {
  const body = await req.json();
  const { message, is_internal } = body;

  if (!message) {
    return new Response(
      JSON.stringify({ error: 'Message is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('organization_id')
    .eq('id', ticketId)
    .single();

  if (!ticket) {
    return new Response(
      JSON.stringify({ error: 'Ticket not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!isSuperAdmin && ticket.organization_id !== profile.organization_id) {
    return new Response(
      JSON.stringify({ error: 'Forbidden' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { data: newMessage, error } = await supabase
    .from('ticket_messages')
    .insert({
      ticket_id: ticketId,
      user_id: profile.id,
      user_name: profile.full_name || profile.email,
      user_role: profile.role,
      message,
      is_internal: isSuperAdmin && is_internal === true,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return new Response(JSON.stringify(newMessage), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}