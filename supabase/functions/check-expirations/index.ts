import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date();
    const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    let sentCount = 0;

    const { data: expiring30Licenses } = await supabase
      .from('licenses')
      .select('*, organization_id, assigned_to')
      .lte('expiration_date', in30Days.toISOString().split('T')[0])
      .gt('expiration_date', in7Days.toISOString().split('T')[0])
      .eq('notification_30_sent', false)
      .not('expiration_date', 'is', null);

    for (const license of expiring30Licenses || []) {
      await sendExpirationNotification(supabase, license, 30, 'license');
      await supabase.from('licenses').update({ 
        notification_30_sent: true,
        last_notification_date: new Date().toISOString()
      }).eq('id', license.id);
      sentCount++;
    }

    const { data: expiring7Licenses } = await supabase
      .from('licenses')
      .select('*, organization_id, assigned_to')
      .lte('expiration_date', in7Days.toISOString().split('T')[0])
      .gt('expiration_date', today.toISOString().split('T')[0])
      .eq('notification_7_sent', false)
      .not('expiration_date', 'is', null);

    for (const license of expiring7Licenses || []) {
      await sendExpirationNotification(supabase, license, 7, 'license');
      await supabase.from('licenses').update({ 
        notification_7_sent: true,
        last_notification_date: new Date().toISOString()
      }).eq('id', license.id);
      sentCount++;
    }

    const { data: expiredLicenses } = await supabase
      .from('licenses')
      .select('*, organization_id, assigned_to')
      .lte('expiration_date', today.toISOString().split('T')[0])
      .eq('notification_expired_sent', false)
      .not('expiration_date', 'is', null);

    for (const license of expiredLicenses || []) {
      await sendExpiredNotification(supabase, license, 'license');
      await supabase.from('licenses').update({ 
        notification_expired_sent: true,
        last_notification_date: new Date().toISOString()
      }).eq('id', license.id);
      sentCount++;
    }

    const { data: expiring30Hardware } = await supabase
      .from('hardware')
      .select('*, organization_id, assigned_to')
      .lte('warranty_expiration', in30Days.toISOString().split('T')[0])
      .gt('warranty_expiration', in7Days.toISOString().split('T')[0])
      .eq('notification_30_sent', false)
      .not('warranty_expiration', 'is', null);

    for (const hardware of expiring30Hardware || []) {
      await sendExpirationNotification(supabase, hardware, 30, 'hardware');
      await supabase.from('hardware').update({ 
        notification_30_sent: true,
        last_notification_date: new Date().toISOString()
      }).eq('id', hardware.id);
      sentCount++;
    }

    const { data: expiring30Contracts } = await supabase
      .from('contracts')
      .select('*, organization_id, assigned_to')
      .lte('end_date', in30Days.toISOString().split('T')[0])
      .gt('end_date', in7Days.toISOString().split('T')[0])
      .eq('notification_30_sent', false)
      .not('end_date', 'is', null);

    for (const contract of expiring30Contracts || []) {
      await sendExpirationNotification(supabase, contract, 30, 'contract');
      await supabase.from('contracts').update({ 
        notification_30_sent: true,
        last_notification_date: new Date().toISOString()
      }).eq('id', contract.id);
      sentCount++;
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        sentCount,
        processed: {
          expiring30Licenses: expiring30Licenses?.length || 0,
          expiring7Licenses: expiring7Licenses?.length || 0,
          expiredLicenses: expiredLicenses?.length || 0,
          expiring30Hardware: expiring30Hardware?.length || 0,
          expiring30Contracts: expiring30Contracts?.length || 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error checking expirations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getAdditionalRecipients(supabase: any, userId: string): Promise<string[]> {
  const { data: recipients } = await supabase
    .from('notification_recipients')
    .select('email')
    .eq('user_id', userId);

  return recipients?.map((r: any) => r.email) || [];
}

async function sendExpirationNotification(
  supabase: any,
  asset: any,
  daysLeft: number,
  type: 'license' | 'hardware' | 'contract'
) {
  const { data: admins } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('organization_id', asset.organization_id)
    .in('role', ['super_admin', 'admin']);

  const appUrl = Deno.env.get('APP_URL') || 'https://app.traceti.com';

  for (const admin of admins || []) {
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('preferences, email_enabled')
      .eq('user_id', admin.id)
      .maybeSingle();

    const notifKey = type === 'license'
      ? (daysLeft === 30 ? 'license_expiring_30' : 'license_expiring_7')
      : type === 'hardware'
        ? 'hardware_warranty_expiring'
        : 'contract_expiring';

    if (!prefs || (prefs.email_enabled !== false && prefs.preferences?.[notifKey] !== false)) {
      const assetName = type === 'license'
        ? asset.software_name || asset.name
        : asset.name;

      const vendor = type === 'license' ? asset.vendor : asset.brand || asset.vendor;

      const expirationDate = type === 'license'
        ? asset.expiration_date
        : type === 'hardware'
          ? asset.warranty_expiration
          : asset.end_date;

      const additionalRecipients = await getAdditionalRecipients(supabase, admin.id);

      const emailPayload: any = {
        to: admin.email,
        subject: `⚠️ ${assetName} expires in ${daysLeft} days`,
        template: 'license-expiring',
        data: {
          userName: admin.full_name || 'there',
          licenseName: assetName,
          vendor: vendor || 'Unknown',
          expirationDate: new Date(expirationDate).toLocaleDateString(),
          daysLeft,
          licenseId: asset.id,
          appUrl
        }
      };

      if (additionalRecipients.length > 0) {
        emailPayload.cc = additionalRecipients;
      }

      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify(emailPayload)
      });
    }
  }
}

async function sendExpiredNotification(
  supabase: any,
  asset: any,
  type: 'license' | 'hardware' | 'contract'
) {
  const { data: admins } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('organization_id', asset.organization_id)
    .in('role', ['super_admin', 'admin']);

  const appUrl = Deno.env.get('APP_URL') || 'https://app.traceti.com';

  for (const admin of admins || []) {
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('preferences, email_enabled')
      .eq('user_id', admin.id)
      .maybeSingle();

    if (!prefs || (prefs.email_enabled !== false && prefs.preferences?.['license_expired'] !== false)) {
      const assetName = type === 'license'
        ? asset.software_name || asset.name
        : asset.name;

      const additionalRecipients = await getAdditionalRecipients(supabase, admin.id);

      const emailPayload: any = {
        to: admin.email,
        subject: `🚨 ${assetName} has expired`,
        template: 'license-expiring',
        data: {
          userName: admin.full_name || 'there',
          licenseName: assetName,
          vendor: asset.vendor || 'Unknown',
          expirationDate: new Date(asset.expiration_date).toLocaleDateString(),
          daysLeft: 0,
          licenseId: asset.id,
          appUrl
        }
      };

      if (additionalRecipients.length > 0) {
        emailPayload.cc = additionalRecipients;
      }

      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify(emailPayload)
      });
    }
  }
}
