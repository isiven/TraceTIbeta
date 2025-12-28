import { useState, useEffect } from 'react';
import { superAdminApi, Organization } from '../lib/superAdminApi';

export const useOrganizations = (filters?: {
  status?: string;
  plan?: string;
  page?: number;
  limit?: number;
}) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setLoading(true);
        const result = await superAdminApi.listOrganizations(filters);
        setOrganizations(result.organizations);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      } catch (err) {
        console.error('Error fetching organizations:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch organizations');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, [filters?.status, filters?.plan, filters?.page, filters?.limit]);

  return { organizations, loading, error, total, totalPages };
};
