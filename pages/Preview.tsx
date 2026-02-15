import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, AlertTriangle, ChevronRight } from 'lucide-react';
import { apiService } from '../services/apiService';
import { Deal } from '../types';
import { Button } from '../components/Button';

export const Preview: React.FC = () => {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeal = async () => {
      if (!dealId) return;
      const data = await apiService.getDeal(dealId);
      if (data) setDeal(data);
      setLoading(false);
    };
    fetchDeal();
  }, [dealId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-indigo-600 rounded-full border-t-transparent"></div></div>;
  if (!deal) return <div>Deal not found</div>;

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Risk Alert Header */}
      <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 mb-6 flex flex-col items-center text-center animate-fade-in-up">
        <div className="bg-orange-100 p-3 rounded-full mb-3 text-orange-600">
          <AlertTriangle size={32} />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Attention Required</h1>
        <p className="text-slate-700 font-medium">
          {deal.preview?.risk_message || "We found multiple issues with this deal."}
        </p>
        <p className="text-sm text-slate-500 mt-2">
          You are potentially overpaying by <span className="font-bold text-slate-900">{deal.preview?.potential_savings_range || "$1,000+"}</span>.
        </p>
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <span className="font-semibold text-slate-700">Vehicle Info</span>
          <span className="text-xs bg-slate-200 px-2 py-1 rounded text-slate-600">ID: {dealId?.slice(-4)}</span>
        </div>
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-1">{deal.extracted_fields?.vehicle_name || deal.extracted_fields?.vehicle || 'Unknown Vehicle'}</h2>
          <div className="flex justify-between items-baseline mt-4">
            <span className="text-slate-500">Dealer OTD Price</span>
            <span className="text-2xl font-bold text-slate-900">${(deal.extracted_fields?.otd_price || deal.extracted_fields?.price || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Locked Analysis Preview */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
        <div className="absolute inset-0 z-10 bg-white/10 backdrop-blur-[6px] flex flex-col items-center justify-center p-6 text-center">
          <Lock size={40} className="text-slate-800 mb-4 drop-shadow-md" />
          <h3 className="text-xl font-bold text-slate-900 mb-2 drop-shadow-sm">Full Analysis Locked</h3>
          <p className="text-slate-900 font-medium mb-6 drop-shadow-sm">Unlock to see the Red Flags and Negotiation Script.</p>
          <Button
            onClick={() => navigate(`/paywall/${dealId}`)}
            className="px-8 py-4 text-base shadow-xl"
            fullWidth
          >
            Unlock Report
            <ChevronRight size={20} className="ml-1" />
          </Button>
        </div>

        {/* Blurred Content Background */}
        <div className="p-6 opacity-30 select-none filter blur-sm">
          <div className="flex justify-between mb-6">
            <div>
              <p className="text-sm text-slate-500 font-bold uppercase">Deal Score</p>
              <p className="text-3xl font-bold text-red-500">42/100</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500 font-bold uppercase">Red Flags</p>
              <p className="text-3xl font-bold text-slate-900">3 Found</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 rounded w-full"></div>
            <div className="h-4 bg-slate-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    </div>
  );
};