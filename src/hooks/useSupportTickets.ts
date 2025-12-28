import { useState, useEffect } from 'react';
import { superAdminApi, SupportTicket } from '../lib/superAdminApi';

export const useSupportTickets = (filters?: {
  status?: string;
  priority?: string;
  page?: number;
  limit?: number;
}) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const refetch = async () => {
    try {
      setLoading(true);
      const result = await superAdminApi.listTickets(filters);
      setTickets(result.tickets);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, [filters?.status, filters?.priority, filters?.page, filters?.limit]);

  return { tickets, loading, error, total, totalPages, refetch };
};
