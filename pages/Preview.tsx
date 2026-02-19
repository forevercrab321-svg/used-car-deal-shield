import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, AlertTriangle, ChevronRight, Shield } from 'lucide-react';
import { apiService } from '../services/apiService';
import { Deal } from '../types';
import { Button } from '../components/Button';

export const Preview: React.FC = () => {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null); // Quick fix for user type

  useEffect(() => {
    const init = async () => {
      const u = await apiService.getCurrentUser();
      setUser(u);
    };
    init();
  }, []);

  useEffect(() => {
    const fetchDeal = async () => {
      if (!dealId) return;
      const data = await apiService.getDeal(dealId);
      if (data) setDeal(data);
      setLoading(false);
    };
    fetchDeal();
  }, [dealId]);

  // Fetch Report if Unlocked
  useEffect(() => {
    if (deal && (deal.paid || user?.role === 'admin')) {
      const loadReport = async () => {
        const res = await apiService.analyzeDeal(deal.deal_id);
        if (res.report) setReport(res.report);
      };
      loadReport();
    }
  }, [deal, user]);

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

      {/* FULL REPORT VIEW (If Unlocked) */}
      {report ? (
        <div className="space-y-6 animate-fade-in-up">
          {/* Score Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Deal Score</h3>
              <p className="text-slate-500 text-sm">Lower is better (0-100)</p>
            </div>
            <div className={`text-4xl font-extrabold ${report.deal_score > 70 ? 'text-red-500' : report.deal_score > 40 ? 'text-orange-500' : 'text-green-500'}`}>
              {report.deal_score}
            </div>
          </div>

          {/* Red Flags */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-500" />
                Red Flags & Hidden Fees
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {report.red_flags.map((flag: any, i: number) => (
                <div key={i} className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-800">{flag.name}</h4>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${flag.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                      {flag.severity}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm mb-3">{flag.description}</p>

                  <div className="bg-indigo-50 rounded-lg p-3 text-sm text-indigo-900 border border-indigo-100">
                    <span className="font-bold">Negotiation Tip:</span> {flag.suggested_action}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scripts */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900">Negotiation Script</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Email Template</h4>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap font-mono">
                  {report.negotiation_script?.email || "No email script available."}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Locked Analysis Preview - Skip if Admin or Paid */
        (!deal.paid && user?.role !== 'admin') ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
            <div className="absolute inset-0 z-10 bg-white/10 backdrop-blur-[6px] flex flex-col items-center justify-center p-6 text-center">
              <Lock size={40} className="text-slate-800 mb-4 drop-shadow-md" />
              <h3 className="text-xl font-bold text-slate-900 mb-2 drop-shadow-sm">Full Analysis Locked</h3>
              <p className="text-slate-900 font-medium mb-6 drop-shadow-sm max-w-sm">
                Unlock the full report to see exactly where you're overpaying and how to fix it.
              </p>

              {/* Value Checklist */}
              <div className="bg-white/80 p-4 rounded-xl shadow-lg mb-6 text-left space-y-2 border border-white/50 backdrop-blur-md">
                <p className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 mb-2">What you get:</p>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="text-green-600">✓</span> <span>Line-by-line Fee Analysis</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="text-green-600">✓</span> <span>Custom Negotiation Scripts</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="text-green-600">✓</span> <span>Live Market Price Check (KBB/Edmunds)</span>
                </div>
              </div>

              <Button
                onClick={() => navigate(`/paywall/${dealId}`)}
                className="px-8 py-4 text-base shadow-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-none"
                fullWidth
              >
                Unlock Report - $19.99
                <ChevronRight size={20} className="ml-1" />
              </Button>

              <div className="mt-4 flex items-center justify-center gap-1 text-xs font-semibold text-slate-600 bg-white/50 px-3 py-1 rounded-full">
                <Shield size={12} className="text-indigo-600" />
                <span>100% Money Back Guarantee</span>
              </div>
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
        ) : (
          <div className="flex justify-center p-12">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-600 rounded-full border-t-transparent"></div>
          </div>
        )
      )}
    </div>
  );
};