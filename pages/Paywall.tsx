import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check, Lock, ShieldCheck } from 'lucide-react';
import { Button } from '../components/Button';
import { apiService } from '../services/apiService';

export const Paywall: React.FC = () => {
  const { dealId } = useParams();
  const [isLoading, setIsLoading] = useState(false);

  const handleUnlock = async () => {
    if (!dealId) return;
    setIsLoading(true);
    try {
      const url = await apiService.createCheckoutSession(dealId);
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center h-16 w-16 bg-indigo-100 text-indigo-600 rounded-full mb-6">
          <Lock size={32} />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-4">Don't Overpay.</h1>
        <p className="text-slate-600">Unlock the full analysis to see exactly where the dealer is hiding profit.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

        <div className="flex items-end justify-center mb-8 gap-2">
          <span className="text-5xl font-extrabold text-slate-900">$19.99</span>
          <span className="text-slate-500 font-medium mb-2">/ report</span>
        </div>

        <div className="space-y-4 mb-8">
          {[
            "Deal Score (0-100)",
            "Hidden Fees Detected",
            "Fair Market Value Range",
            "Target OTD Price",
            "Copy-Paste Negotiation Script"
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="bg-green-100 p-1 rounded-full">
                <Check size={14} className="text-green-600" />
              </div>
              <span className="text-slate-700 font-medium">{item}</span>
            </div>
          ))}
        </div>

        <Button
          fullWidth
          size="lg"
          onClick={handleUnlock}
          isLoading={isLoading}
          className="py-4 text-lg bg-slate-900 hover:bg-slate-800"
        >
          Unlock Full Report
        </Button>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck size={14} />
          100% Secure Payment via Stripe
        </div>
      </div>
    </div>
  );
};