import React from 'react';
import { Link } from 'react-router-dom';
import { Scan, ShieldAlert, FileSearch, ArrowRight } from 'lucide-react';
import { Button } from '../components/Button';

export const Landing: React.FC = () => {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden pt-20 pb-24 text-center px-4">
        <div className="inline-flex items-center rounded-full border border-orange-100 bg-orange-50 px-4 py-1.5 text-sm font-semibold text-orange-600 mb-8 animate-fade-in">
          <ShieldAlert size={16} className="mr-2" />
          Stop getting ripped off
        </div>
        
        <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl md:text-7xl mb-6 max-w-4xl mx-auto">
          Your <span className="text-indigo-600">Deal Shield</span> against hidden fees.
        </h1>
        
        <p className="mx-auto max-w-2xl text-xl text-slate-600 mb-10 leading-relaxed">
          Upload your car deal sheet. We instantly flag fake add-ons, inflated fees, and give you the script to negotiate the price down.
        </p>
        
        <Link to="/upload">
          <Button size="lg" className="px-10 py-5 text-lg shadow-xl shadow-indigo-200 hover:shadow-indigo-300 transition-all transform hover:-translate-y-1">
            Scan Deal Sheet
            <ArrowRight className="ml-2 h-6 w-6" />
          </Button>
        </Link>
        
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400">
          <Scan size={16} />
          <span>Supports PDF, JPG, PNG</span>
        </div>
      </section>

      {/* How it works */}
      <section className="w-full bg-white py-20 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-8">
           <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg mb-4">1</div>
              <h3 className="text-xl font-bold mb-2">Upload</h3>
              <p className="text-slate-600">Take a picture of the buyer's order or finance sheet from the dealer.</p>
           </div>
           <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg mb-4">2</div>
              <h3 className="text-xl font-bold mb-2">Analyze</h3>
              <p className="text-slate-600">AI scans for 30+ known dealer tricks, hidden markups, and fake fees.</p>
           </div>
           <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg mb-4">3</div>
              <h3 className="text-xl font-bold mb-2">Negotiate</h3>
              <p className="text-slate-600">Get a specific "Remove this fee" script to save $1,000+ instantly.</p>
           </div>
        </div>
      </section>
    </div>
  );
};