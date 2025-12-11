export interface NotificationConfig {
  id: string;
  label: string;
  description: string;
  category: 'expirations' | 'team' | 'summaries' | 'account';
  defaultEnabled: boolean;
}

export const USER_NOTIFICATIONS: Record<string, NotificationConfig> = {
  license_expiring_30: {
    id: 'license_expiring_30',
    label: 'License expiring in 30 days',
    description: 'Get notified when a license is about to expire',
    category: 'expirations',
    defaultEnabled: true
  },
  license_expiring_7: {
    id: 'license_expiring_7',
    label: 'License expiring in 7 days',
    description: 'Urgent reminder before license expires',
    category: 'expirations',
    defaultEnabled: true
  },
  license_expired: {
    id: 'license_expired',
    label: 'License expired',
    description: 'Alert when a license has expired',
    category: 'expirations',
    defaultEnabled: true
  },
  hardware_warranty_expiring: {
    id: 'hardware_warranty_expiring',
    label: 'Hardware warranty expiring',
    description: 'Get notified when hardware warranty is about to expire',
    category: 'expirations',
    defaultEnabled: true
  },
  contract_expiring: {
    id: 'contract_expiring',
    label: 'Contract expiring',
    description: 'Get notified when a support contract is about to expire',
    category: 'expirations',
    defaultEnabled: true
  },
  user_invited: {
    id: 'user_invited',
    label: 'Team member invited',
    description: 'When you invite someone to your organization',
    category: 'team',
    defaultEnabled: true
  },
  user_joined: {
    id: 'user_joined',
    label: 'Team member joined',
    description: 'When someone accepts your invitation',
    category: 'team',
    defaultEnabled: true
  },
  user_removed: {
    id: 'user_removed',
    label: 'Team member removed',
    description: 'When a team member is removed',
    category: 'team',
    defaultEnabled: false
  },
  weekly_summary: {
    id: 'weekly_summary',
    label: 'Weekly summary',
    description: 'Get a weekly report of your assets status',
    category: 'summaries',
    defaultEnabled: true
  },
  monthly_report: {
    id: 'monthly_report',
    label: 'Monthly report',
    description: 'Detailed monthly report with analytics',
    category: 'summaries',
    defaultEnabled: false
  },
  subscription_renewed: {
    id: 'subscription_renewed',
    label: 'Subscription renewed',
    description: 'Confirmation when your subscription renews',
    category: 'account',
    defaultEnabled: true
  },
  payment_failed: {
    id: 'payment_failed',
    label: 'Payment failed',
    description: 'Alert when a payment fails',
    category: 'account',
    defaultEnabled: true
  },
  plan_limit_warning: {
    id: 'plan_limit_warning',
    label: 'Plan limit warning',
    description: 'When you reach 80% of your plan limits',
    category: 'account',
    defaultEnabled: true
  }
};

export interface AdminNotificationConfig {
  id: string;
  label: string;
  description: string;
  defaultEnabled: boolean;
}

export const ADMIN_NOTIFICATIONS: Record<string, AdminNotificationConfig> = {
  new_organization: {
    id: 'new_organization',
    label: 'New organization signup',
    description: 'When a new company registers',
    defaultEnabled: true
  },
  subscription_upgraded: {
    id: 'subscription_upgraded',
    label: 'Subscription upgraded',
    description: 'When an org upgrades their plan',
    defaultEnabled: true
  },
  subscription_cancelled: {
    id: 'subscription_cancelled',
    label: 'Subscription cancelled',
    description: 'When an org cancels their plan',
    defaultEnabled: true
  },
  payment_received: {
    id: 'payment_received',
    label: 'Payment received',
    description: 'When a payment is processed',
    defaultEnabled: false
  },
  daily_summary: {
    id: 'daily_summary',
    label: 'Daily platform summary',
    description: 'Daily metrics and signups',
    defaultEnabled: true
  }
};

export interface NotificationCategory {
  label: string;
  icon: string;
  description: string;
}

export const NOTIFICATION_CATEGORIES: Record<string, NotificationCategory> = {
  expirations: {
    label: 'Expiration Alerts',
    icon: 'Clock',
    description: 'Alerts about expiring licenses, warranties, and contracts'
  },
  team: {
    label: 'Team Updates',
    icon: 'Users',
    description: 'Updates about team members'
  },
  summaries: {
    label: 'Reports & Summaries',
    icon: 'BarChart3',
    description: 'Periodic reports and summaries'
  },
  account: {
    label: 'Account & Billing',
    icon: 'CreditCard',
    description: 'Subscription and payment notifications'
  }
};
