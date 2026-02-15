
import { serve } from 'std/http/server.ts';
import { Hono } from 'hono';
import { cors } from 'hono/middleware.ts';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const app = new Hono();

// DEBUG LOGGER
app.use('*', async (c, next) => {
    console.log(`[REQUEST] ${c.req.method} ${c.req.url} -> Path: ${c.req.path}`);
    await next();
});


// 1. Middleware & Setup
const FRONTEND_ORIGIN = Deno.env.get('FRONTEND_ORIGIN') || '*';

// Global CORS - verify it applies to all paths including /api
app.use('*', cors({
    origin: FRONTEND_ORIGIN,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
}));

// OPTIONS handler for CORS preflight on all routes
app.options('*', (c) => c.text('', 204));


const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    httpClient: Stripe.createFetchHttpClient(),
});

// Helper to get user from Auth header
async function getUser(c: any) {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) return null;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user;
}

// 2. Auth (Login)
// 2. Auth (OTP Flow)
app.post('/api/auth/otp/send', async (c) => {
    const { email } = await c.req.json();
    if (!email) return c.json({ error: 'Email required' }, 400);

    // Call Resend
    const resendKey = Deno.env.get('RESEND_API_KEY');

    // Default to success logic even if no key (for demo capability if key missing)
    if (resendKey) {
        try {
            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${resendKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: 'onboarding@resend.dev', // Default Resend testing sender
                    to: email,
                    subject: 'Your Deal Shield Verification Code',
                    html: '<p>Your code is: <strong>123456</strong></p>'
                })
            });
            if (!res.ok) {
                console.error("Resend Error:", await res.text());
                // Don't fail the request, just log. allow demo default code.
            }
        } catch (e) {
            console.error("Resend Exception:", e);
        }
    }

    // Always simulate success for the demo flow with hardcoded code
    return c.json({ success: true, message: "Code sent" });
});

app.post('/api/auth/otp/verify', async (c) => {
    const { email, code } = await c.req.json();
    if (code !== '123456') {
        return c.json({ error: "Invalid code" }, 400);
    }

    // Create Session
    const DEMO_PASSWORD = Deno.env.get('BACKEND_USER_PASSWORD') || "demo-password-123";

    let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: DEMO_PASSWORD
    });

    if (signInError) {
        // Use Admin API to create user with email auto-confirmed
        const { data: userData, error: createError } = await supabase.auth.admin.createUser({
            email,
            password: DEMO_PASSWORD,
            email_confirm: true
        });

        if (createError) {
            return c.json({ error: createError.message }, 400);
        }

        // Now sign in to get the session
        const { data: newSignInData, error: newSignInError } = await supabase.auth.signInWithPassword({
            email,
            password: DEMO_PASSWORD
        });

        if (newSignInError) {
            return c.json({ error: newSignInError.message }, 500);
        }
        signInData = newSignInData;
    }

    if (!signInData.session) {
        return c.json({ error: "Could not create session." }, 500);
    }

    return c.json({
        token: signInData.session.access_token,
        refreshToken: signInData.session.refresh_token,
        user: { id: signInData.user?.id, email: signInData.user?.email }
    });
});

// 3. User Info (/me)
app.get('/api/me', async (c) => {
    const user = await getUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ user, entitlements: { credits: 0 } });
});

// 4. File Presign
app.post('/api/files/presign', async (c) => {
    const user = await getUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const fileId = `uploads/${user.id}/${crypto.randomUUID()}.pdf`;
    const { data, error } = await supabase.storage
        .from('deal_files')
        .createSignedUploadUrl(fileId, 3600); // 1 hour expiry

    if (error) return c.json({ error: error.message }, 500);

    return c.json({
        uploadUrl: data.signedUrl,
        fileUrl: fileId
    });
});

// 5. File Confirm
app.post('/api/files/confirm', async (c) => {
    const user = await getUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const { fileUrl } = await c.req.json();
    return c.json({ fileId: fileUrl });
});

// 6. Parse Deal
app.post('/api/deals/parse', async (c) => {
    const user = await getUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { fileId, zip } = await c.req.json();
    const dealId = crypto.randomUUID();

    // Mock extracted data to feed into Gemini later
    const extracted = {
        vehicle: "2021 Honda CR-V EX-L",
        price: 26500,
        fees: { doc_fee: 699, prep_fee: 1295, gps: 899 },
        vin: "1HKRW2H87M...",
        mileage: 34000
    };

    const preview = {
        vehicle_name: extracted.vehicle,
        price: `$${extracted.price.toLocaleString()}`,
        mileage: extracted.mileage.toLocaleString()
    };

    const { error } = await supabase.from('deals').insert({
        id: dealId,
        user_id: user.id,
        file_path: fileId,
        zip_code: zip,
        status: 'parsed',
        preview_data: preview,
        extracted_fields: extracted
    });

    if (error) return c.json({ error: error.message }, 500);

    return c.json({
        dealId,
        preview,
        riskHint: {
            count: 3,
            message: "We found multiple potential issues. Unlock the $19.99 full report to see exactly what to negotiate."
        }
    });
});

// 7. Stripe Checkout
app.post('/api/billing/checkout', async (c) => {
    const user = await getUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { dealId } = await c.req.json();

    const { data: deal } = await supabase.from('deals').select('paid').eq('id', dealId).single();
    if (deal?.paid) return c.json({ error: "Already paid" }, 400);

    const priceId = Deno.env.get('STRIPE_PRICE_ID');
    const session = await stripe.checkout.sessions.create({
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'payment',
        success_url: `${FRONTEND_ORIGIN}/report/${dealId}?success=1`,
        cancel_url: `${FRONTEND_ORIGIN}/paywall/${dealId}?canceled=1`,
        metadata: {
            dealId: dealId,
            userId: user.id
        }
    });

    await supabase.from('deals').update({ stripe_session_id: session.id }).eq('id', dealId);

    return c.json({ checkoutUrl: session.url });
});

// 8. Billing Status
app.get('/api/billing/status', async (c) => {
    const dealId = c.req.query('dealId');
    if (!dealId) return c.json({ error: 'Missing dealId' }, 400);
    const { data: deal } = await supabase.from('deals').select('paid').eq('id', dealId).single();
    return c.json({ paid: !!deal?.paid });
});

// 9. Analyze Deal (GEMINI Integrated)
app.post('/api/deals/analyze', async (c) => {
    const user = await getUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { dealId } = await c.req.json();

    // 1. Verify Payment
    const { data: deal } = await supabase.from('deals').select('*').eq('id', dealId).single();
    if (!deal?.paid) return c.json({ requiresPayment: true });

    // 2. Check Cache
    const { data: existingReport } = await supabase.from('reports').select('*').eq('deal_id', dealId).single();
    if (existingReport) {
        // Reconstitute the expected JSON structure
        return c.json({
            report: {
                score: existingReport.score,
                category: existingReport.category,
                red_flags: existingReport.red_flags,
                target_otd_range: existingReport.target_otd_range,
                scripts: existingReport.negotiation_script,
                summary: existingReport.summary
            }
        });
    }

    // 3. Call Gemini
    const dealContext = JSON.stringify({
        extracted: deal.extracted_fields,
        zip: deal.zip_code
    });

    const prompt = `
    You are an expert car buyer advocate. Analyze this deal data: ${dealContext}.
    Identify hidden fees/red flags.
    Return ONLY valid JSON in this structure:
    {
      "score": number (0-100, lower is better deal),
      "red_flags": [ {"title": string, "severity":"high"|"medium"|"low", "explanation": string, "estimated_savings": number, "negotiation_line": string} ],
      "target_otd_range": { "min": number, "max": number },
      "scripts": { "email": string, "in_person": string },
      "summary": "Short 2 sentence summary calling out the biggest rip-off."
    }
    No markdown, just raw JSON.
  `;

    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });

    let reportData;
    const aiJson = await aiRes.json();

    try {
        const text = aiJson.candidates?.[0]?.content?.parts?.[0]?.text || "";
        // Clean markdown if present
        const jsonStr = text.replace(/^```json\n|\n```$/g, "").trim();
        reportData = JSON.parse(jsonStr);
    } catch (e) {
        console.error("Gemini Parse Error", e, JSON.stringify(aiJson));
        // Fallback if AI fails (e.g. key issue or hallucination)
        reportData = {
            score: 50,
            red_flags: [{ title: "AI Analysis Failed", severity: "medium", explanation: "Could not generate report.", estimated_savings: 0, negotiation_line: "" }],
            target_otd_range: { min: 25000, max: 26000 },
            scripts: { email: "", in_person: "" },
            summary: "Manual review required."
        };
    }

    // 4. Save to DB
    await supabase.from('reports').upsert({
        deal_id: deal.id,
        score: reportData.score,
        category: reportData.score > 80 ? 'Excellent' : reportData.score > 60 ? 'Fair' : 'Risky',
        red_flags: reportData.red_flags,
        negotiation_script: reportData.scripts,
        summary: reportData.summary,
        target_otd_range: reportData.target_otd_range
    }, { onConflict: 'deal_id' });

    return c.json({ report: reportData });
});

// 10. Webhook
app.post('/api/stripe/webhook', async (c) => {
    const signature = c.req.header('Stripe-Signature');
    const body = await c.req.text();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    let event;
    try {
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
        return c.json({ error: `Webhook Error: ${err.message}` }, 400);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const dealId = session.metadata?.dealId;

        if (dealId) {
            await supabase.from('deals').update({
                paid: true,
                paid_at: new Date().toISOString(),
                amount_cents: session.amount_total,
                stripe_session_id: session.id
            }).eq('id', dealId);
        }
    }

    return c.json({ received: true });
});

serve(app.fetch);
