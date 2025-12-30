import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Calendar, TrendingUp, X, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface BudgetPlan {
  id: string;
  organization_id: string;
  fiscal_year: number;
  name: string;
  description: string | null;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'active';
  total_amount: number;
  created_at: string;
  item_count?: number;
}

export default function BudgetPlanning() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [budgetPlans, setBudgetPlans] = useState<BudgetPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    fiscal_year: new Date().getFullYear() + 1,
    name: '',
    description: ''
  });

  useEffect(() => {
    if (profile?.organization_id) {
      fetchBudgetPlans();
    }
  }, [profile]);

  const fetchBudgetPlans = async () => {
    try {
      setLoading(true);

      const { data: plans, error: plansError } = await supabase
        .from('budget_plans')
        .select('*')
        .eq('organization_id', profile!.organization_id)
        .order('fiscal_year', { ascending: false });

      if (plansError) throw plansError;

      const plansWithCounts = await Promise.all(
        (plans || []).map(async (plan) => {
          const { count } = await supabase
            .from('budget_items')
            .select('*', { count: 'exact', head: true })
            .eq('budget_plan_id', plan.id);

          return { ...plan, item_count: count || 0 };
        })
      );

      setBudgetPlans(plansWithCounts);
    } catch (error) {
      console.error('Error fetching budget plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      fiscal_year: new Date().getFullYear() + 1,
      name: '',
      description: ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.organization_id) return;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('budget_plans')
        .insert({
          organization_id: profile.organization_id,
          fiscal_year: formData.fiscal_year,
          name: formData.name,
          description: formData.description || null,
          status: 'draft',
          created_by: profile.id
        })
        .select()
        .single();

      if (error) throw error;

      handleCloseModal();
      navigate(`/app/budgets/${data.id}`);
    } catch (error) {
      console.error('Error creating budget plan:', error);
      alert('Failed to create budget plan. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'submitted': return 'bg-yellow-100 text-yellow-700';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'active': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-mediumGray">Loading budget plans...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-darkGray">Budget Planning</h1>
          <p className="text-mediumGray mt-1">Plan and track your IT budget allocations</p>
        </div>
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={20} />
          New Budget Plan
        </button>
      </div>

      {budgetPlans.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <DollarSign className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-darkGray mb-2">No budget plans yet</h3>
          <p className="text-mediumGray mb-6">Create your first budget plan to start tracking expenses.</p>
          <button
            onClick={handleOpenModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={20} />
            Create First Budget Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgetPlans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => navigate(`/app/budgets/${plan.id}`)}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Calendar className="text-primary" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-darkGray">FY {plan.fiscal_year}</h3>
                    <p className="text-sm text-mediumGray">{plan.name}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(plan.status)}`}>
                  {plan.status}
                </span>
              </div>

              {plan.description && (
                <p className="text-sm text-mediumGray mb-4 line-clamp-2">{plan.description}</p>
              )}

              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-mediumGray">Total Budget</span>
                  <span className="text-lg font-bold text-primary">{formatCurrency(plan.total_amount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-mediumGray">Budget Items</span>
                  <span className="text-sm font-medium text-darkGray">{plan.item_count || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-mediumGray">Created</span>
                  <span className="text-sm text-mediumGray">{new Date(plan.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-darkGray">New Budget Plan</h2>
              <button onClick={handleCloseModal} className="text-mediumGray hover:text-darkGray">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">
                  Fiscal Year <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  value={formData.fiscal_year}
                  onChange={(e) => setFormData({ ...formData, fiscal_year: parseInt(e.target.value) })}
                  min={new Date().getFullYear()}
                  max={new Date().getFullYear() + 10}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">
                  Budget Plan Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Annual IT Budget 2025"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Optional description of this budget plan"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 border border-gray-300 text-darkGray rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Budget Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
