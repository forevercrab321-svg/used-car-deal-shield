import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, ScanLine, FileSearch, Sparkles } from 'lucide-react';
import { apiService } from '../services/apiService';
import { VehicleType, Deal, DealStatus } from '../types';
import { Button } from '../components/Button';

export const Parsing: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fileId = searchParams.get('fileId');
  const type = searchParams.get('type') as VehicleType;

  const [step, setStep] = useState(1); // 1: OCR, 2: Extracting, 3: Done
  const [deal, setDeal] = useState<Deal | null>(null);

  useEffect(() => {
    if (!fileId || !type) {
      navigate('/upload');
      return;
    }

    const processDeal = async () => {
      try {
        // Step 1: Simulate OCR
        setTimeout(() => setStep(2), 1500);

        // Actual API call
        const parsedDeal = await apiService.parseDeal(fileId, type);
        setDeal(parsedDeal);

        // Step 2 -> 3
        setStep(3);
      } catch (err) {
        console.error(err);
        // Handle error (in real app show error UI)
      }
    };

    processDeal();
  }, [fileId, type, navigate]);

  const handleUnlock = () => {
    if (deal) {
      // Navigate to Paywall with dealId
      navigate(`/paywall?dealId=${deal.deal_id}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="mb-12">
        {step < 3 ? (
          <div className="relative mx-auto w-24 h-24 mb-6">
            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
               <ScanLine size={32} className="animate-pulse" />
            </div>
          </div>
        ) : (
          <div className="mx-auto w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 animate-bounce-short">
            <CheckCircle2 size={40} />
          </div>
        )}
        
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {step === 1 && "Scanning Document..."}
          {step === 2 && "Extracting Financial Data..."}
          {step === 3 && "Analysis Complete!"}
        </h2>
        <p className="text-slate-500">
          {step === 1 && "We are using OCR to read your document."}
          {step === 2 && "Identifying fees, add-ons, and interest rates."}
          {step === 3 && "We found 15 data points and 3 potential red flags."}
        </p>
      </div>

      {/* Preview Card (Only visible when done) */}
      {step === 3 && deal && (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-left animate-fade-in-up">
          <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
             <div>
                <h3 className="font-bold text-slate-900">{deal.extracted_fields.vehicle_name}</h3>
                <p className="text-sm text-slate-500">Deal ID: #{deal.deal_id.slice(-6)}</p>
             </div>
             <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Parsed</span>
          </div>
          
          <div className="p-6 grid grid-cols-2 gap-y-6 gap-x-4">
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold mb-1">MSRP</p>
              <p className="text-lg font-medium text-slate-900">${deal.extracted_fields.msrp.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Total OTD Price</p>
              <p className="text-lg font-bold text-indigo-600">${deal.extracted_fields.otd_price.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Dealer Add-ons</p>
              <p className="text-lg font-medium text-red-600">${deal.extracted_fields.add_ons.toLocaleString()}</p>
            </div>
             <div>
              <p className="text-xs text-slate-500 uppercase font-semibold mb-1">APR Interest</p>
              <p className="text-lg font-medium text-slate-900">{deal.extracted_fields.apr}%</p>
            </div>
          </div>

          <div className="p-6 border-t border-slate-100 bg-slate-50/50">
             <div className="flex items-start gap-3 mb-6">
                <Sparkles className="text-indigo-600 shrink-0 mt-1" size={20} />
                <p className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">Analysis Preview:</span> We detected a "Market Adjustment" fee and high nitrogen tire charges. Unlock the full report to see the negotiation script.
                </p>
             </div>
             <Button fullWidth size="lg" onClick={handleUnlock}>
                Unlock Full Report & Scripts
             </Button>
          </div>
        </div>
      )}
    </div>
  );
};