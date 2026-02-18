
import { supabase } from '../lib/supabase';
import { Deal, Report, DealStatus, VehicleType, User } from '../types';

// Helper to map DB deal to frontend Deal type
const mapDbDealToType = (dbDeal: any): Deal => ({
    deal_id: dbDeal.id,
    user_id: dbDeal.user_id,
    vehicle_type: dbDeal.vehicle_type as VehicleType,
    file_id: dbDeal.file_path,
    zip_code: dbDeal.zip_code,
    extracted_fields: dbDeal.extracted_fields || {},
    status: dbDeal.status as DealStatus,
    created_at: dbDeal.created_at,
    preview: dbDeal.preview_data ? {
        risk_count: dbDeal.preview_data.risk_count,
        potential_savings_range: dbDeal.preview_data.potential_savings_range,
        risk_message: dbDeal.preview_data.risk_message
    } : undefined
});

export const apiService = {
    // 1. Auth (Custom OTP Flow)
    sendOtp: async (email: string) => {
        // Call backend to send code via Resend
        await apiService._fetchApi('/auth/otp/send', 'POST', { email }, false);
    },

    verifyOtp: async (email: string, code: string) => {
        // Call backend to verify code and get session
        const data = await apiService._fetchApi('/auth/otp/verify', 'POST', { email, code }, false);

        // Update Supabase session manually since we got token from backend
        const { error } = await supabase.auth.setSession({
            access_token: data.token,
            refresh_token: data.refreshToken
        });
        if (error) throw error;

        return data.user;
    },

    adminLogin: async (password: string) => {
        const data = await apiService._fetchApi('/auth/admin/login', 'POST', { password }, false);

        const { error } = await supabase.auth.setSession({
            access_token: data.token,
            refresh_token: data.refreshToken
        });
        if (error) throw error;

        return data.user;
    },

    getCurrentUser: async (): Promise<User | null> => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return null;

        // We can fetch profile from DB or just use session for speed
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        return {
            user_id: session.user.id,
            email: session.user.email || '',
            name: profile?.full_name || session.user.email?.split('@')[0] || 'User',
            credits: profile?.credits || 0
        };
    },

    logout: async () => { await supabase.auth.signOut(); },

    // Helper to call Unified Backend API
    _fetchApi: async (path: string, method: string, body?: any, requireAuth = true) => {
        let session = null;
        if (requireAuth) {
            const { data } = await supabase.auth.getSession();
            session = data.session;
            if (!session) throw new Error("Unauthorized");
        }

        // Construct URL: {SUPABASE_URL}/functions/v1/api{path}
        const projectUrl = import.meta.env.VITE_SUPABASE_URL;
        const functionUrl = `${projectUrl}/functions/v1/api${path}`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };

        if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const res = await fetch(functionUrl, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "API Error");
        return json;
    },

    // 2. File Upload Flow (Using Backend Presign)
    uploadDealFile: async (file: File): Promise<{ fileId: string; filePath: string }> => {
        // Step A: Get Presigned URL from Backend
        const { uploadUrl, fileUrl } = await apiService._fetchApi('/files/presign', 'POST', {});

        // Step B: Upload directly to Storage (PUT)
        await fetch(uploadUrl, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type }
        });

        // Step C: Confirm Upload (Optional based on backend logic, but good practice)
        await apiService._fetchApi('/files/confirm', 'POST', { fileUrl });

        return { fileId: fileUrl, filePath: fileUrl };
    },

    // 3. Parse Deal (Backend)
    parseDeal: async (fileId: string, zip: string): Promise<Deal> => {
        const res = await apiService._fetchApi('/deals/parse', 'POST', { fileId, zip });

        // Backend now creates the record. We just map it.
        // The endpoint returns { dealId, preview, riskHint }
        // We might need to fetch the full deal to match the `Deal` type or construct it.
        // Let's fetch the full deal record from DB to be safe and get consistent format.
        return apiService.getDeal(res.dealId) as Promise<Deal>;
    },

    // 4. Get Deal
    getDeal: async (dealId: string): Promise<Deal | null> => {
        const { data, error } = await supabase
            .from('deals')
            .select('*')
            .eq('id', dealId)
            .single();
        if (error || !data) return null;
        return mapDbDealToType(data);
    },

    // 5. Billing 
    checkPaymentStatus: async (dealId: string): Promise<boolean> => {
        const res = await apiService._fetchApi(`/billing/status?dealId=${dealId}`, 'GET');
        return res.paid;
    },

    createCheckoutSession: async (dealId: string): Promise<string> => {
        const res = await apiService._fetchApi('/billing/checkout', 'POST', { dealId });
        return res.checkoutUrl;
    },

    markAsPaid: (dealId: string) => { /* No-op, handled by webhook */ },

    // 6. Analyze (Backend with Gemini)
    analyzeDeal: async (dealId: string): Promise<{ report?: Report; requires_payment?: boolean }> => {
        const res = await apiService._fetchApi('/deals/analyze', 'POST', { dealId });

        if (res.requiresPayment) return { requires_payment: true };

        // Map report - align backend fields to frontend types
        const r = res.report;
        return {
            report: {
                report_id: r.id || 'generated',
                deal_id: dealId,
                deal_score: r.score,
                score_category: r.category || (r.score > 80 ? 'Excellent' : r.score > 60 ? 'Fair' : 'Risky'),
                red_flags: (r.red_flags || []).map((f: any) => ({
                    name: f.title || f.name,
                    severity: f.severity,
                    description: f.explanation || f.description,
                    suggested_action: f.negotiation_line || f.suggested_action,
                    estimated_savings: f.estimated_savings || 0
                })),
                target_otd_range: r.target_otd_range,
                negotiation_script: r.scripts || r.negotiation_script,
                summary: r.summary
            }
        };
    },

    // 7. History
    getUserDeals: async (): Promise<Deal[]> => {
        const user = await apiService.getCurrentUser();
        if (!user) return [];
        const { data } = await supabase.from('deals').select('*').eq('user_id', user.user_id).order('created_at', { ascending: false });
        // @ts-ignore
        return (data || []).map(mapDbDealToType);
    }
};
