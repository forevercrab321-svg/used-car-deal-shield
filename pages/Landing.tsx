import React from 'react';
import { Link } from 'react-router-dom';
import { Scan, ShieldAlert, FileSearch, ArrowRight, Shield, Star, CheckCircle, Zap, DollarSign, HelpCircle } from 'lucide-react';
import { Button } from '../components/Button';

const FAQ_ITEMS = [
  { q: "What documents can I upload?", a: "We support PDF files, photos (JPG/PNG) of buyer's orders, deal sheets, and finance agreements from any dealership." },
  { q: "How does the AI analysis work?", a: "Our AI scans your document for 30+ known dealer tactics, hidden markups, inflated fees, and compares your deal against market data." },
  { q: "Is my data secure?", a: "Yes. Files are encrypted in transit and stored securely. We never share your data with dealerships or third parties." },
  { q: "What if I'm not satisfied?", a: "We stand behind our analysis. If you don't find any useful savings, contact us for a full refund within 48 hours." },
];

export const Landing: React.FC = () => {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden pt-20 pb-24 text-center px-4">
        {/* Decorative background gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-100 rounded-full opacity-40 blur-3xl"></div>
          <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-purple-100 rounded-full opacity-30 blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center rounded-full border border-orange-100 bg-orange-50 px-4 py-1.5 text-sm font-semibold text-orange-600 mb-8 animate-fade-in">
            <ShieldAlert size={16} className="mr-2" />
            Stop getting ripped off
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl md:text-7xl mb-6 max-w-4xl mx-auto leading-[1.1]">
            Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Deal Shield</span> against hidden fees.
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
        </div>
      </section>

      {/* Stats Banner */}
      <section className="w-full bg-slate-900 py-10 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "12,000+", label: "Deals Analyzed" },
            { value: "$2,847", label: "Avg. Savings Found" },
            { value: "30+", label: "Fee Types Detected" },
            { value: "4.9★", label: "User Rating" },
          ].map((stat, i) => (
            <div key={i}>
              <p className="text-2xl md:text-3xl font-extrabold text-white">{stat.value}</p>
              <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="w-full bg-white py-20 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold text-center text-slate-900 mb-4">How It Works</h2>
          <p className="text-center text-slate-500 mb-12 max-w-xl mx-auto">Three simple steps to uncover hidden fees and negotiate like a pro.</p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Scan size={28} />, step: "1", title: "Upload", desc: "Take a picture of the buyer's order or finance sheet from the dealer." },
              { icon: <FileSearch size={28} />, step: "2", title: "Analyze", desc: "AI scans for 30+ known dealer tricks, hidden markups, and fake fees." },
              { icon: <DollarSign size={28} />, step: "3", title: "Negotiate", desc: "Get a specific \"Remove this fee\" script to save $1,000+ instantly." },
            ].map((item, i) => (
              <div key={i} className="p-8 bg-gradient-to-b from-slate-50 to-white rounded-2xl border border-slate-100 hover:shadow-lg hover:border-indigo-100 transition-all duration-300 group">
                <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-5 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 text-slate-900">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Detect */}
      <section className="w-full bg-slate-50 py-20 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold text-center text-slate-900 mb-4">What We Detect</h2>
          <p className="text-center text-slate-500 mb-12 max-w-2xl mx-auto">Our AI is trained to catch the tricks dealers use to inflate your price.</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              "Market Adjustment Fees",
              "Inflated Doc Fees",
              "Nitrogen Tire Charges",
              "GPS Tracking Devices",
              "Paint Protection Markup",
              "Fabric Coating Scams",
              "Dealer Prep Fees",
              "VIN Etching Overcharge",
              "Extended Warranty Markup",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-4 border border-slate-100">
                <CheckCircle size={18} className="text-green-500 shrink-0" />
                <span className="text-slate-700 font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="w-full bg-white py-20 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold text-center text-slate-900 mb-12">What Our Users Say</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Mike T.", savings: "$3,200", quote: "Found hidden market adjustment and a GPS fee I didn't ask for. The negotiation script worked perfectly." },
              { name: "Sarah L.", savings: "$1,800", quote: "I was about to sign when I scanned the deal. Saved almost $2k in inflated doc fees and add-ons." },
              { name: "Jason R.", savings: "$4,500", quote: "The dealer actually respected me more when I quoted specific fee names. Saved a fortune on my truck." },
            ].map((t, i) => (
              <div key={i} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} size={16} className="text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-slate-600 mb-4 leading-relaxed">"{t.quote}"</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">— {t.name}</span>
                  <span className="text-sm bg-green-50 text-green-700 font-bold px-2 py-1 rounded-lg">Saved {t.savings}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="w-full bg-slate-50 py-20 border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold text-center text-slate-900 mb-12">
            <HelpCircle size={28} className="inline mr-2 text-indigo-600" />
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-100 p-6">
                <h3 className="font-bold text-slate-900 mb-2">{item.q}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 py-16 px-4 text-center">
        <h2 className="text-3xl font-extrabold text-white mb-4">Ready to Save on Your Next Car Deal?</h2>
        <p className="text-indigo-100 mb-8 max-w-xl mx-auto">Upload your deal sheet in seconds and find out exactly how much you can save.</p>
        <Link to="/upload">
          <button className="px-10 py-4 bg-white text-indigo-700 font-bold rounded-xl text-lg shadow-xl hover:shadow-2xl hover:bg-slate-50 transition-all transform hover:-translate-y-1">
            Start Free Scan
            <ArrowRight className="inline ml-2 h-5 w-5" />
          </button>
        </Link>
      </section>
    </div>
  );
};