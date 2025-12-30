import React, { useState, useEffect } from 'react';
import { Calendar, AlertTriangle, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface ForecastData {
  quarter: string;
  licenses: { count: number; totalCost: number };
  hardware: { count: number; totalCost: number };
  contracts: { count: number; totalCost: number };
}

export default function ExpirationForecast() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (profile?.organization_id) {
      fetchForecast();
    }
  }, [profile]);

  const fetchForecast = async () => {
    try {
      setLoading(true);

      const today = new Date();
      const quarters = [
        { name: 'Q1', start: new Date(today.getFullYear(), 0, 1), end: new Date(today.getFullYear(), 2, 31) },
        { name: 'Q2', start: new Date(today.getFullYear(), 3, 1), end: new Date(today.getFullYear(), 5, 30) },
        { name: 'Q3', start: new Date(today.getFullYear(), 6, 1), end: new Date(today.getFullYear(), 8, 30) },
        { name: 'Q4', start: new Date(today.getFullYear(), 9, 1), end: new Date(today.getFullYear(), 11, 31) }
      ];

      const forecast: ForecastData[] = [];

      for (const quarter of quarters) {
        const startDate = quarter.start.toISOString().split('T')[0];
        const endDate = quarter.end.toISOString().split('T')[0];

        const [licensesRes, hardwareRes, contractsRes] = await Promise.all([
          supabase
            .from('licenses')
            .select('renewal_cost')
            .eq('organization_id', profile!.organization_id)
            .gte('expiration_date', startDate)
            .lte('expiration_date', endDate),
          supabase
            .from('hardware')
            .select('purchase_cost')
            .eq('organization_id', profile!.organization_id)
            .gte('warranty_expiration', startDate)
            .lte('warranty_expiration', endDate),
          supabase
            .from('support_contracts')
            .select('annual_cost')
            .eq('organization_id', profile!.organization_id)
            .gte('renewal_date', startDate)
            .lte('renewal_date', endDate)
        ]);

        const licenses = licensesRes.data || [];
        const hardware = hardwareRes.data || [];
        const contracts = contractsRes.data || [];

        forecast.push({
          quarter: `${quarter.name} ${today.getFullYear()}`,
          licenses: {
            count: licenses.length,
            totalCost: licenses.reduce((sum, l) => sum + (l.renewal_cost || 0), 0)
          },
          hardware: {
            count: hardware.length,
            totalCost: hardware.reduce((sum, h) => sum + ((h.purchase_cost || 0) * 0.8), 0)
          },
          contracts: {
            count: contracts.length,
            totalCost: contracts.reduce((sum, c) => sum + (c.annual_cost || 0), 0)
          }
        });
      }

      setForecastData(forecast);
    } catch (error) {
      console.error('Error fetching forecast:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBudget = async () => {
    if (!confirm('Create a new budget plan from this forecast?')) return;

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('budget_plans')
        .insert({
          organization_id: profile!.organization_id,
          fiscal_year: new Date().getFullYear(),
          name: `Budget from Forecast ${new Date().getFullYear()}`,
          description: 'Generated from expiration forecast',
          status: 'draft',
          created_by: profile!.id
        })
        .select()
        .single();

      if (error) throw error;

      navigate(`/app/budgets/${data.id}`);
    } catch (error) {
      console.error('Error creating budget:', error);
      alert('Failed to create budget plan. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
  };

  const getTotalForQuarter = (quarter: ForecastData) => {
    return quarter.licenses.totalCost + quarter.hardware.totalCost + quarter.contracts.totalCost;
  };

  const getYearTotal = () => {
    return forecastData.reduce((sum, q) => sum + getTotalForQuarter(q), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-mediumGray">Loading forecast...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-darkGray">Expiration Forecast</h1>
          <p className="text-mediumGray mt-1">12-month forecast of expiring assets and renewals</p>
        </div>
        <button
          onClick={handleCreateBudget}
          disabled={creating}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Plus size={20} />
          {creating ? 'Creating...' : 'Create Budget from Forecast'}
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle className="text-orange-500" size={24} />
          <div>
            <div className="text-sm text-mediumGray">12-Month Total Forecast</div>
            <div className="text-3xl font-bold text-darkGray">{formatCurrency(getYearTotal())}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {forecastData.map((quarter, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Calendar className="text-blue-600" size={20} />
              </div>
              <h3 className="font-bold text-darkGray">{quarter.quarter}</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div>
                  <div className="text-xs text-mediumGray">Licenses Expiring</div>
                  <div className="text-sm font-medium text-darkGray">{quarter.licenses.count} items</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-blue-600">{formatCurrency(quarter.licenses.totalCost)}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div>
                  <div className="text-xs text-mediumGray">Hardware Warranties</div>
                  <div className="text-sm font-medium text-darkGray">{quarter.hardware.count} items</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-600">{formatCurrency(quarter.hardware.totalCost)}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div>
                  <div className="text-xs text-mediumGray">Contract Renewals</div>
                  <div className="text-sm font-medium text-darkGray">{quarter.contracts.count} items</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-green-600">{formatCurrency(quarter.contracts.totalCost)}</div>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-darkGray">Subtotal</div>
                  <div className="text-lg font-bold text-primary">{formatCurrency(getTotalForQuarter(quarter))}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
