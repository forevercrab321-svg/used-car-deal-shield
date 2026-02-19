import React, { useEffect, useState } from 'react';
import { Star, CheckCircle, Shield } from 'lucide-react';
import { apiService } from '../services/apiService';
import { Review } from '../types';
import { Button } from './Button';
import { Link } from 'react-router-dom';

export const ReviewsSection: React.FC = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const data = await apiService.getReviews();
                setReviews(data);
            } catch (err) {
                console.error("Failed to load reviews", err);
            } finally {
                setLoading(false);
            }
        };
        fetchReviews();
    }, []);

    return (
        <section className="w-full bg-white py-20 border-t border-slate-100">
            <div className="max-w-6xl mx-auto px-4 text-center">
                <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Real User Reviews</h2>
                <div className="flex justify-center items-center gap-2 mb-12">
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                        <Shield size={12} /> Verified Buyers Only
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-8">
                        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 rounded-full border-t-transparent"></div>
                    </div>
                ) : reviews.length === 0 ? (
                    /* Zero State - Honest & Transparent */
                    <div className="bg-slate-50 rounded-2xl p-12 border border-slate-100 max-w-2xl mx-auto">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4 text-slate-300">
                            <Star size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Be the first to share your savings!</h3>
                        <p className="text-slate-500 mb-6 max-w-md mx-auto">
                            We just launched our Verified Review system. We only accept reviews from users who have actually purchased a report. No fake 5-star bots here.
                        </p>
                        <Link to="/upload">
                            <Button size="sm" variant="outline">Start Your Scan</Button>
                        </Link>
                    </div>
                ) : (
                    /* Reviews Grid */
                    <div className="grid md:grid-cols-3 gap-6">
                        {reviews.map((review) => (
                            <div key={review.id} className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-left">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={16} className={`${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded font-medium">
                                        <CheckCircle size={10} /> Verified
                                    </div>
                                </div>
                                <p className="text-slate-800 mb-4 text-sm leading-relaxed">"{review.comment}"</p>
                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-200">
                                    <span className="text-xs font-bold text-slate-500">Deal Shield User</span>
                                    <span className="text-xs text-slate-400">{new Date(review.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};
