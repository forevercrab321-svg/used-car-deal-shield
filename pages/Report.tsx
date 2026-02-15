import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Copy, Check, AlertTriangle, ArrowLeft } from 'lucide-react';
import { apiService } from '../services/apiService';
import { Report as ReportType } from '../types';
import { Button } from '../components/Button';

export const Report: React.FC = () => {
  const { dealId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [report, setReport] = useState<ReportType | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedScript, setCopiedScript] = useState<'email' | 'in_person' | null>(null);

  useEffect(() => {
    if (!dealId) return;

    // Simulate marking as paid if success param is present
    if (searchParams.get('success') === 'true') {
      apiService.markAsPaid(dealId);
    }

    const loadData = async () => {
      try {
        const result = await apiService.analyzeDeal(dealId);
        if (result.requires_payment) {
          navigate(`/paywall/${dealId}`);
        } else if (result.report) {
          setReport(result.report);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [dealId, navigate, searchParams]);

  const handleCopy = (text: string, type: 'email' | 'in_person') => {
    navigator.clipboard.writeText(text);
    setCopiedScript(type);
    setTimeout(() => setCopiedScript(null), 2000);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-indigo-600 rounded-full border-t-transparent"></div></div>;
  if (!report) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-20">
      <Button variant="outline" size="sm" onClick={() => navigate('/history')} className="mb-6">
        <ArrowLeft size={16} className="mr-2"/> Back to History
      </Button>

      {/* Header Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analysis Result</h1>
          <p className="text-slate-500">ID: {dealId}</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-right">
            <p className="text-xs font-bold uppercase text-slate-500">Deal Score</p>
            <p className={`text-3xl font-black ${report.deal_score < 50 ? 'text-red-500' : 'text-green-500'}`}>{report.deal_score}/100</p>
          </div>
          <div className="h-10 w-px bg-slate-200"></div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase text-slate-500">Target OTD</p>
            <p className="text-xl font-bold text-indigo-600">${report.target_otd_range.min.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left: Issues */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={20} />
            Detected Red Flags
          </h2>
          
          {report.red_flags.map((flag, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-red-100 p-5 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-slate-900">{flag.name}</h3>
                <span className="bg-red-50 text-red-700 text-xs font-bold px-2 py-1 rounded">SAVE ${flag.estimated_savings}</span>
              </div>
              <p className="text-slate-600 text-sm mb-3">{flag.description}</p>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-xs font-bold text-indigo-600 uppercase mb-1">Recommended Action</p>
                <p className="text-sm font-medium text-slate-800">{flag.suggested_action}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Scripts */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Negotiation Scripts</h2>
          
          {/* Email Script */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
             <div className="flex justify-between items-center mb-3">
               <h3 className="font-bold text-slate-800 text-sm">Email Template</h3>
               <button 
                 onClick={() => handleCopy(report.negotiation_script.email, 'email')}
                 className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-md transition-colors"
               >
                 {copiedScript === 'email' ? <Check size={18} /> : <Copy size={18} />}
               </button>
             </div>
             <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 max-h-60 overflow-y-auto text-xs leading-relaxed text-slate-700 whitespace-pre-wrap">
               {report.negotiation_script.email}
             </div>
          </div>

          {/* In Person Script */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
             <div className="flex justify-between items-center mb-3">
               <h3 className="font-bold text-slate-800 text-sm">In-Person Script</h3>
               <button 
                 onClick={() => handleCopy(report.negotiation_script.in_person, 'in_person')}
                 className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-md transition-colors"
               >
                 {copiedScript === 'in_person' ? <Check size={18} /> : <Copy size={18} />}
               </button>
             </div>
             <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 max-h-60 overflow-y-auto text-xs leading-relaxed text-slate-700 whitespace-pre-wrap">
               {report.negotiation_script.in_person}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};