import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ActivityLog {
  id: string;
  actor_email: string;
  actor_type: string;
  action: string;
  target_type: string | null;
  target_name: string | null;
  details: any;
  created_at: string;
}

export const usePlatformActivity = (limit: number = 50) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    try {
      setLoading(true);

      const { data, error: activityError } = await supabase
        .from('platform_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (activityError) throw activityError;

      setActivities(data || []);
    } catch (err) {
      console.error('Error fetching activity log:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch activity log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [limit]);

  return { activities, loading, error, refetch: fetchActivities };
};
