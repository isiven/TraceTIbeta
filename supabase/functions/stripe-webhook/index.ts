import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey, Stripe-Signature',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.text();
    const event = JSON.parse(body);

    console.log('Stripe webhook event:', event.type);

    switch (event.type) {
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(supabase, event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(supabase, event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabase, event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(supabase, event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(supabase, event.data.object);
        break;

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in stripe-webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handlePaymentSucceeded(supabase: any, invoice: any) {
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;
  const amount = invoice.amount_paid / 100;

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (subscription) {
    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        current_period_start: new Date(invoice.period_start * 1000).toISOString(),
        current_period_end: new Date(invoice.period_end * 1000).toISOString(),
      })
      .eq('id', subscription.id);

    await supabase
      .from('organizations')
      .update({
        subscription_status: 'active',
      })
      .eq('id', subscription.organization_id);

    await supabase.from('platform_activity_log').insert({
      action: 'payment_succeeded',
      target_type: 'subscription',
      target_id: subscription.id,
      details: { amount, invoice_id: invoice.id },
    });
  }
}

async function handlePaymentFailed(supabase: any, invoice: any) {
  const subscriptionId = invoice.subscription;
  const amount = invoice.amount_due / 100;

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (subscription) {
    await supabase
      .from('subscriptions')
      .update({ status: 'past_due' })
      .eq('id', subscription.id);

    await supabase
      .from('organizations')
      .update({ subscription_status: 'past_due' })
      .eq('id', subscription.organization_id);

    await supabase.from('platform_activity_log').insert({
      action: 'payment_failed',
      target_type: 'subscription',
      target_id: subscription.id,
      details: { amount, invoice_id: invoice.id },
    });

    const { data: org } = await supabase
      .from('organizations')
      .select('billing_email, owner_email')
      .eq('id', subscription.organization_id)
      .single();

    if (org?.billing_email || org?.owner_email) {
      console.log('TODO: Send payment failed email to:', org.billing_email || org.owner_email);
    }
  }
}

async function handleSubscriptionDeleted(supabase: any, subscription: any) {
  const subscriptionId = subscription.id;

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (sub) {
    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', sub.id);

    await supabase
      .from('organizations')
      .update({
        subscription_status: 'cancelled',
        mrr: 0,
      })
      .eq('id', sub.organization_id);

    await supabase.from('platform_activity_log').insert({
      action: 'subscription_cancelled',
      target_type: 'subscription',
      target_id: sub.id,
      details: { stripe_subscription_id: subscriptionId },
    });
  }
}

async function handleSubscriptionUpdated(supabase: any, subscription: any) {
  const subscriptionId = subscription.id;
  const amount = subscription.items.data[0]?.price.unit_amount / 100 || 0;
  const interval = subscription.items.data[0]?.price.recurring?.interval || 'monthly';

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (sub) {
    const mrr = interval === 'yearly' ? amount / 12 : amount;

    await supabase
      .from('subscriptions')
      .update({
        amount,
        interval,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      })
      .eq('id', sub.id);

    await supabase
      .from('organizations')
      .update({
        subscription_status: subscription.status,
        mrr,
      })
      .eq('id', sub.organization_id);

    await supabase.from('platform_activity_log').insert({
      action: 'subscription_updated',
      target_type: 'subscription',
      target_id: sub.id,
      details: { amount, interval, status: subscription.status },
    });
  }
}

async function handleSubscriptionCreated(supabase: any, subscription: any) {
  const subscriptionId = subscription.id;
  const customerId = subscription.customer;
  const amount = subscription.items.data[0]?.price.unit_amount / 100 || 0;
  const interval = subscription.items.data[0]?.price.recurring?.interval || 'monthly';
  const planId = subscription.items.data[0]?.price.metadata?.plan_id || 'pro';

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (org) {
    const mrr = interval === 'yearly' ? amount / 12 : amount;

    await supabase.from('subscriptions').insert({
      organization_id: org.id,
      plan_id: planId,
      status: subscription.status,
      amount,
      interval,
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: customerId,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    });

    await supabase
      .from('organizations')
      .update({
        subscription_plan: planId,
        subscription_status: subscription.status,
        stripe_subscription_id: subscriptionId,
        mrr,
      })
      .eq('id', org.id);

    await supabase.from('platform_activity_log').insert({
      action: 'subscription_created',
      target_type: 'subscription',
      target_id: org.id,
      details: { amount, interval, plan_id: planId },
    });
  }
}