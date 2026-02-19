import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, FileText, X, AlertCircle, MapPin, Shield } from 'lucide-react';
import { Button } from '../components/Button';
import { apiService } from '../services/apiService';

export const Upload: React.FC = () => {
  const navigate = useNavigate();
  const [zipCode, setZipCode] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("Analyze Deal");
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files.length) validateAndSetFile(e.dataTransfer.files[0]);
  };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) validateAndSetFile(e.target.files[0]);
  };

  const validateAndSetFile = (file: File) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic'];
    if (!validTypes.includes(file.type)) {
      setError("Supported formats: PDF, JPG, PNG");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("File size must be under 15MB.");
      return;
    }
    setError(null);
    setFile(file);
  };

  const handleSubmit = async () => {
    if (!file) return;
    if (zipCode.length < 5) {
      setError("Please enter a valid ZIP code.");
      return;
    }

    setIsProcessing(true);
    setStatusText("Uploading...");

    try {
      // 1. Upload to Supabase Storage
      setStatusText("Uploading...");
      const { fileId } = await apiService.uploadDealFile(file);

      // 2. Parse Deal (Edge Function)
      setStatusText("Scanning Document...");

      // 3. Confirm & Parse
      const deal = await apiService.parseDeal(fileId, zipCode);

      setStatusText("Analysis Complete");
      navigate(`/preview/${deal.deal_id}`);

    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      setIsProcessing(false);
      setStatusText("Analyze Deal");
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold text-center text-slate-900 mb-2">Scan Deal Sheet</h2>
      <p className="text-center text-slate-500 mb-8">Upload your buyer's order to detect hidden fees.</p>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">

        {/* Step 1: Zip Code */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
            <MapPin size={16} className="text-indigo-600" />
            Where is the dealer located?
          </label>
          <input
            type="text"
            placeholder="Enter ZIP Code (e.g. 90210)"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium"
            maxLength={5}
          />
        </div>

        {/* Step 2: File Upload */}
        <div className="p-8">
          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer group
                ${isDragging
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}
              `}
              onClick={() => document.getElementById('fileInput')?.click()}
            >
              <input type="file" id="fileInput" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileInput} />
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <UploadIcon size={28} />
              </div>
              <p className="text-lg font-medium text-slate-900 mb-2">Tap to upload Deal Sheet</p>
              <p className="text-sm text-slate-500">PDF or Photo (JPG/PNG)</p>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between border border-slate-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-indigo-600">
                  <FileText size={24} />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold text-slate-900 truncate max-w-[200px]">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button onClick={() => setFile(null)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                <X size={20} />
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700">
              <AlertCircle size={20} className="mt-0.5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Security Reassurance */}
          <div className="mt-6 flex flex-col items-center justify-center text-center space-y-2">
            <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
              <div className="bg-green-100 p-1 rounded-full text-green-600">
                <Shield size={14} /> {/* Assuming Shield is imported or I need to import Lock */}
              </div>
              <span>Bank-Level 256-bit Encryption</span>
            </div>
            <p className="text-xs text-slate-400 max-w-xs">
              Your deal is analyzed privately. We <strong>never</strong> share your personal data with dealerships or third parties.
            </p>
          </div>
        </div>

        {/* Action */}
        <div className="p-6 bg-slate-50 border-t border-slate-200">
          <Button
            fullWidth
            size="lg"
            disabled={!file || !zipCode}
            isLoading={isProcessing}
            onClick={handleSubmit}
          >
            {statusText}
          </Button>
        </div>
      </div>
    </div>
  );
};