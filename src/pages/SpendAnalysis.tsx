import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface SpendData {
  totalSpend: number;
  licenseSpend: number;
  hardwareSpend: number;
  contractSpend: number;
  byVendor: { vendor_name: string; total: number }[];
  byCategory: { category: string; total: number }[];
  byDepartment: { department: string; total: number }[];
}

export default function SpendAnalysis() {
  const { profile } = useAuth();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [spendData, setSpendData] = useState<SpendData>({
    totalSpend: 0,
    licenseSpend: 0,
    hardwareSpend: 0,
    contractSpend: 0,
    byVendor: [],
    byCategory: [],
    byDepartment: []
  });
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    if (profile?.organization_id) {
      fetchSpendData();
    }
  }, [profile, selectedYear]);

  const fetchSpendData = async () => {
    try {
      setLoading(true);

      const yearStart = `${selectedYear}-01-01`;
      const yearEnd = `${selectedYear}-12-31`;

      const [licensesRes, hardwareRes, contractsRes] = await Promise.all([
        supabase
          .from('licenses')
          .select('purchase_cost, renewal_cost, department, vendor:vendors(name), purchase_date')
          .eq('organization_id', profile!.organization_id)
          .gte('purchase_date', yearStart)
          .lte('purchase_date', yearEnd),
        supabase
          .from('hardware')
          .select('purchase_cost, department, manufacturer:vendors(name), purchase_date')
          .eq('organization_id', profile!.organization_id)
          .gte('purchase_date', yearStart)
          .lte('purchase_date', yearEnd),
        supabase
          .from('support_contracts')
          .select('annual_cost, department, vendor:vendors(name), start_date')
          .eq('organization_id', profile!.organization_id)
          .gte('start_date', yearStart)
          .lte('start_date', yearEnd)
      ]);

      let licenseSpend = 0;
      let hardwareSpend = 0;
      let contractSpend = 0;
      const vendorMap: { [key: string]: number } = {};
      const categoryMap: { [key: string]: number } = {};
      const departmentMap: { [key: string]: number } = {};

      (licensesRes.data || []).forEach((license) => {
        const cost = license.purchase_cost || license.renewal_cost || 0;
        licenseSpend += cost;
        if (license.vendor?.name) {
          vendorMap[license.vendor.name] = (vendorMap[license.vendor.name] || 0) + cost;
        }
        categoryMap['Software'] = (categoryMap['Software'] || 0) + cost;
        if (license.department) {
          departmentMap[license.department] = (departmentMap[license.department] || 0) + cost;
        }
      });

      (hardwareRes.data || []).forEach((hardware) => {
        const cost = hardware.purchase_cost || 0;
        hardwareSpend += cost;
        if (hardware.manufacturer?.name) {
          vendorMap[hardware.manufacturer.name] = (vendorMap[hardware.manufacturer.name] || 0) + cost;
        }
        categoryMap['Hardware'] = (categoryMap['Hardware'] || 0) + cost;
        if (hardware.department) {
          departmentMap[hardware.department] = (departmentMap[hardware.department] || 0) + cost;
        }
      });

      (contractsRes.data || []).forEach((contract) => {
        const cost = contract.annual_cost || 0;
        contractSpend += cost;
        if (contract.vendor?.name) {
          vendorMap[contract.vendor.name] = (vendorMap[contract.vendor.name] || 0) + cost;
        }
        categoryMap['Services'] = (categoryMap['Services'] || 0) + cost;
        if (contract.department) {
          departmentMap[contract.department] = (departmentMap[contract.department] || 0) + cost;
        }
      });

      const byVendor = Object.entries(vendorMap)
        .map(([vendor_name, total]) => ({ vendor_name, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      const byCategory = Object.entries(categoryMap).map(([category, total]) => ({ category, total }));
      const byDepartment = Object.entries(departmentMap).map(([department, total]) => ({ department, total }));

      setSpendData({
        totalSpend: licenseSpend + hardwareSpend + contractSpend,
        licenseSpend,
        hardwareSpend,
        contractSpend,
        byVendor,
        byCategory,
        byDepartment
      });
    } catch (error) {
      console.error('Error fetching spend data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-mediumGray">Loading spend analysis...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-darkGray">Spend Analysis</h1>
          <p className="text-mediumGray mt-1">Analyze your IT spending patterns</p>
        </div>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <DollarSign className="text-primary" size={24} />
            </div>
            <div className="text-sm text-mediumGray">Total Spend</div>
          </div>
          <div className="text-3xl font-bold text-darkGray">{formatCurrency(spendData.totalSpend)}</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm text-mediumGray mb-2">Software Licenses</div>
          <div className="text-2xl font-bold text-blue-600">{formatCurrency(spendData.licenseSpend)}</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm text-mediumGray mb-2">Hardware</div>
          <div className="text-2xl font-bold text-gray-600">{formatCurrency(spendData.hardwareSpend)}</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm text-mediumGray mb-2">Support Contracts</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(spendData.contractSpend)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-darkGray mb-4">Top Vendors</h2>
          {spendData.byVendor.length === 0 ? (
            <p className="text-mediumGray text-center py-8">No vendor data available</p>
          ) : (
            <div className="space-y-3">
              {spendData.byVendor.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-mediumGray">
                      {index + 1}
                    </div>
                    <span className="text-sm text-darkGray">{item.vendor_name}</span>
                  </div>
                  <div className="text-sm font-medium text-darkGray">{formatCurrency(item.total)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-darkGray mb-4">By Category</h2>
          {spendData.byCategory.length === 0 ? (
            <p className="text-mediumGray text-center py-8">No category data available</p>
          ) : (
            <div className="space-y-4">
              {spendData.byCategory.map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-darkGray font-medium">{item.category}</span>
                    <span className="text-sm font-bold text-darkGray">{formatCurrency(item.total)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${(item.total / spendData.totalSpend) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {spendData.byDepartment.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-darkGray mb-4">By Department</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {spendData.byDepartment.map((item, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-mediumGray mb-1">{item.department}</div>
                <div className="text-xl font-bold text-darkGray">{formatCurrency(item.total)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
