# Email Notifications Setup Guide

This guide explains how to configure and use the email notification system in TraceTI.

## Overview

The notification system consists of:
1. **Database tables** for storing user preferences and email logs
2. **Edge Functions** for sending emails and checking expirations
3. **UI components** for users to manage their notification preferences
4. **Email templates** for professional-looking emails

## Prerequisites

Before setting up email notifications, you need:
1. A Resend account (https://resend.com)
2. A verified domain in Resend
3. A Resend API key

## Setup Steps

### 1. Create a Resend Account

1. Go to https://resend.com and sign up
2. Verify your email address

### 2. Add and Verify Your Domain

1. In the Resend dashboard, go to "Domains"
2. Click "Add Domain"
3. Enter your domain (e.g., `traceti.com`)
4. Add the DNS records shown to your domain's DNS settings:
   - SPF record
   - DKIM record
   - DMARC record (optional but recommended)
5. Wait for verification (usually takes a few minutes)

### 3. Get Your API Key

1. In the Resend dashboard, go to "API Keys"
2. Click "Create API Key"
3. Give it a name (e.g., "TraceTI Production")
4. Copy the API key (you won't be able to see it again!)

### 4. Configure Environment Variables

Add the following environment variable in your Supabase project:

**In Supabase Dashboard:**
1. Go to Settings > Edge Functions
2. Add the environment variable:
   - Name: `RESEND_API_KEY`
   - Value: Your Resend API key (e.g., `re_123456789...`)

3. Add the app URL (optional but recommended):
   - Name: `APP_URL`
   - Value: Your app URL (e.g., `https://app.traceti.com`)

### 5. Deploy Edge Functions

The Edge Functions are already deployed:
- `send-email` - Sends individual emails
- `check-expirations` - Checks for expiring assets daily
- `send-weekly-summary` - Sends weekly summaries

To redeploy or update them, use the Supabase MCP tools.

### 6. Set Up Cron Jobs (Automated Notifications)

To enable automated notifications, you need to set up cron jobs in Supabase:

**Option A: Using Supabase Dashboard**
1. Go to Database > Extensions
2. Enable `pg_cron` extension
3. Go to SQL Editor and run:

```sql
-- Daily expiration check at 8 AM UTC
SELECT cron.schedule(
  'check-expirations-daily',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-expirations',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    )
  )
  $$
);

-- Weekly summary on Mondays at 9 AM UTC
SELECT cron.schedule(
  'weekly-summary',
  '0 9 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-weekly-summary',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    )
  )
  $$
);
```

**Important:** Replace:
- `YOUR_PROJECT_REF` with your actual Supabase project reference
- `YOUR_SERVICE_ROLE_KEY` with your service role key (found in Settings > API)

**To view existing cron jobs:**
```sql
SELECT * FROM cron.job;
```

**To delete a cron job:**
```sql
SELECT cron.unschedule('job-name');
```

## Features

### For Users

Users can manage their notification preferences in **Settings > Notifications**:

1. **Master Toggle**: Enable/disable all email notifications
2. **Category Controls**: Enable/disable entire categories at once
3. **Individual Notifications**: Fine-tune which notifications to receive

#### Notification Types

**Expiration Alerts:**
- License expiring in 30 days
- License expiring in 7 days
- License expired
- Hardware warranty expiring
- Support contract expiring

**Team Updates:**
- Team member invited
- Team member joined
- Team member removed

**Reports & Summaries:**
- Weekly summary (every Monday)
- Monthly report

**Account & Billing:**
- Subscription renewed
- Payment failed
- Plan limit warning (at 80% usage)

### Email Templates

All emails are professionally designed and mobile-responsive. Templates include:
- License expiration warnings
- Hardware warranty alerts
- Contract expiration notices
- Welcome emails
- Team invitations
- Weekly summaries
- Payment notifications

## Testing

### Test Email Sending

You can test email sending by calling the Edge Function directly:

```bash
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/send-email' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "template": "welcome",
    "data": {
      "userName": "John Doe",
      "companyName": "Test Company",
      "loginUrl": "https://app.traceti.com"
    }
  }'
```

### Test Expiration Checks

To manually trigger the expiration check:

```bash
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/check-expirations' \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

This will check all licenses, hardware, and contracts and send notifications to admins.

### Test Weekly Summary

To manually trigger the weekly summary:

```bash
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/send-weekly-summary' \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

## Monitoring

### Email Logs

All sent emails are logged in the `email_log` table. You can query them:

```sql
SELECT
  email_to,
  subject,
  template,
  status,
  created_at
FROM email_log
ORDER BY created_at DESC
LIMIT 50;
```

### Check Failed Emails

```sql
SELECT *
FROM email_log
WHERE status = 'failed'
ORDER BY created_at DESC;
```

### User Preferences

To view a user's notification preferences:

```sql
SELECT
  p.email,
  np.email_enabled,
  np.preferences
FROM notification_preferences np
JOIN auth.users u ON u.id = np.user_id
JOIN profiles p ON p.id = u.id
WHERE p.email = 'user@example.com';
```

## Troubleshooting

### Emails Not Sending

1. **Check API Key**: Verify `RESEND_API_KEY` is set correctly in Supabase
2. **Check Domain**: Ensure your domain is verified in Resend
3. **Check Logs**: Look at the `email_log` table for error messages
4. **Check User Preferences**: Verify the user has notifications enabled

### Cron Jobs Not Running

1. **Verify pg_cron is enabled**: Check in Database > Extensions
2. **Check cron job status**: `SELECT * FROM cron.job;`
3. **Check cron job runs**: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`
4. **Verify Service Role Key**: Make sure it's correct in the cron job SQL

### Wrong Sender Email

The sender email is hardcoded as `TraceTI <notifications@traceti.com>`. To change it:
1. Edit the `send-email` Edge Function
2. Change the `from` field in the email payload
3. Ensure the new sender email/domain is verified in Resend

## Best Practices

1. **Test in Development First**: Use a test domain or Resend's sandbox mode
2. **Monitor Email Deliverability**: Check Resend analytics regularly
3. **Respect User Preferences**: Always check if user has notifications enabled
4. **Rate Limiting**: Be mindful of Resend's rate limits (check your plan)
5. **Email Content**: Keep emails concise and actionable
6. **Unsubscribe Links**: Include unsubscribe options (already in templates)

## Cost Considerations

Resend pricing (as of 2024):
- **Free Plan**: 100 emails/day, 3,000 emails/month
- **Pro Plan**: $20/month for 50,000 emails/month
- **Scale Plan**: Custom pricing

Estimate your usage:
- Daily expiration checks: ~(number of admins × number of expiring items)
- Weekly summaries: ~number of admins (once per week)
- Team notifications: varies based on activity

## Support

For issues with:
- **Resend**: Contact support@resend.com or check their docs
- **Edge Functions**: Check Supabase logs in Dashboard > Edge Functions
- **Database**: Check Supabase logs in Dashboard > Logs

## Additional Resources

- [Resend Documentation](https://resend.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [pg_cron Documentation](https://github.com/citusdata/pg_cron)
