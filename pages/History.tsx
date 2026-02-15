import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, ChevronRight, FileText } from 'lucide-react';
import { apiService } from '../services/apiService';
import { Deal } from '../types';

export const History: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      // Simple auth check
      const user = await apiService.getCurrentUser();
      if (!user) {
        navigate('/account');
        return;
      }
      const data = await apiService.getUserDeals();
      setDeals(data);
    };
    fetchHistory();
  }, [navigate]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Scan History</h1>
      
      {deals.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <FileText className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-lg font-medium text-slate-900">No deals scanned yet</h3>
          <p className="text-slate-500 mb-6">Upload your first deal sheet to get started.</p>
          <Link to="/upload" className="text-indigo-600 font-medium hover:underline">Scan a Deal</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {deals.map((deal) => (
            <Link 
              key={deal.deal_id} 
              to={`/preview/${deal.deal_id}`} // Or logic to check if paid -> report
              className="block bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow group"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-start gap-4">
                  <div className="bg-indigo-50 text-indigo-600 p-3 rounded-lg">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {deal.extracted_fields.vehicle_name || 'Unknown Vehicle'}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(deal.created_at).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span>OTD: ${deal.extracted_fields.otd_price?.toLocaleString() || '---'}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-indigo-600" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};