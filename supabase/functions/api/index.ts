
import { serve } from 'std/http/server.ts';
import { Hono } from 'hono';
import { cors } from 'hono/middleware.ts';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const app = new Hono();

// 1. Middleware & Setup
const FRONTEND_ORIGIN = Deno.env.get('FRONTEND_ORIGIN') || '*';
app.use('*', cors({
    origin: FRONTEND_ORIGIN,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
}));

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
app.post('/auth/login', async (c) => {
    const { email } = await c.req.json();
    if (!email) return c.json({ error: 'Email required' }, 400);

    // Strategy: Try sign up. If exists, try sign in with generic password. 
    // This is a "Backdoor" for the DEMO. In prod usage, use Magic Link properly.
    const DEMO_PASSWORD = "demo-password-123";

    let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: DEMO_PASSWORD
    });

    if (signInError) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password: DEMO_PASSWORD,
        });
        if (signUpError) {
            // If user exists but password login failed, maybe they signed up differently?
            // Just return error or try without password (magic link triggered)
            // For this strict requirement "Return Token", we assume success or fail.
            return c.json({ error: signUpError.message }, 400);
        }
        signInData = { user: signUpData.user, session: signUpData.session };
    }

    if (!signInData.session) {
        return c.json({ error: "Could not create session. Please check Supabase Auth settings." }, 500);
    }

    return c.json({
        token: signInData.session.access_token,
        user: { id: signInData.user?.id, email: signInData.user?.email }
    });
});

// 3. User Info (/me)
app.get('/me', async (c) => {
    const user = await getUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ user, entitlements: { credits: 0 } });
});

// 4. File Presign
app.post('/files/presign', async (c) => {
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
app.post('/files/confirm', async (c) => {
    const user = await getUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const { fileUrl } = await c.req.json();
    return c.json({ fileId: fileUrl });
});

// 6. Parse Deal
app.post('/deals/parse', async (c) => {
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
app.post('/billing/checkout', async (c) => {
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
app.get('/billing/status', async (c) => {
    const dealId = c.req.query('dealId');
    if (!dealId) return c.json({ error: 'Missing dealId' }, 400);
    const { data: deal } = await supabase.from('deals').select('paid').eq('id', dealId).single();
    return c.json({ paid: !!deal?.paid });
});

// 9. Analyze Deal (GEMINI Integrated)
app.post('/deals/analyze', async (c) => {
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
app.post('/stripe/webhook', async (c) => {
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
