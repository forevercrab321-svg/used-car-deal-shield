
import { serve } from 'std/http/server.ts';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const app = new Hono().basePath('/api');

// DEBUG LOGGER
app.use('*', async (c, next) => {
    console.log(`[REQUEST] ${c.req.method} ${c.req.url} -> Path: ${c.req.path}`);
    await next();
});


// 1. Middleware & Setup
const FRONTEND_ORIGIN = Deno.env.get('FRONTEND_ORIGIN') || '';
const CORS_ORIGIN = FRONTEND_ORIGIN || '*';

// Global CORS - verify it applies to all paths including /api
app.use('*', cors({
    origin: CORS_ORIGIN,
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

// ============================================================
// 2. Auth (OTP Flow) - Random Code + DB Verification
// ============================================================
app.post('/auth/otp/send', async (c) => {
    const { email } = await c.req.json();
    if (!email) return c.json({ error: 'Email required' }, 400);

    // Step 1: Generate a RANDOM 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    console.log(`[OTP] Generated code ${code} for ${email}`);

    // Step 2: Store code in DB (upsert by email)
    const { error: dbError } = await supabase.from('verification_codes').upsert({
        email: email,
        code: code,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    }, { onConflict: 'email' });

    if (dbError) {
        console.error('[OTP] DB upsert error:', JSON.stringify(dbError));
        return c.json({ error: 'Failed to generate verification code' }, 500);
    }

    // Step 3: Send email via Resend with the REAL code
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (resendKey) {
        try {
            const emailRes = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${resendKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: 'onboarding@resend.dev',
                    to: email,
                    subject: 'Your Deal Shield Verification Code',
                    html: '<p>Your verification code is: <strong>' + code + '</strong></p><p>This code is valid for 15 minutes.</p>'
                })
            });
            if (!emailRes.ok) {
                const errText = await emailRes.text();
                console.error('[OTP] Resend API error:', errText);
            } else {
                console.log('[OTP] Email sent successfully to', email);
            }
        } catch (e) {
            console.error('[OTP] Resend exception:', e);
        }
    } else {
        console.log('[OTP] No RESEND_API_KEY set. Code for ' + email + ' is ' + code);
    }

    return c.json({ success: true, message: 'Code sent' });
});


app.post('/auth/otp/verify', async (c) => {
    const { email, code } = await c.req.json();
    if (!email || !code) return c.json({ error: 'Email and code required' }, 400);

    console.log('[OTP-VERIFY] Checking code for', email, 'submitted:', code, 'type:', typeof code);

    // Step 1: Look up the stored code from DB
    const { data: record, error: lookupError } = await supabase
        .from('verification_codes')
        .select('*')
        .eq('email', email)
        .single();

    if (lookupError || !record) {
        console.error('[OTP-VERIFY] No code found for', email, 'Error:', JSON.stringify(lookupError));
        return c.json({ error: 'No verification code found. Please request a new one.', debug: { lookupError: lookupError?.message } }, 400);
    }

    console.log('[OTP-VERIFY] DB code:', JSON.stringify(record.code), 'User code:', JSON.stringify(code), 'Match:', String(record.code).trim() === String(code).trim());

    // Step 2: Compare codes
    if (String(record.code).trim() !== String(code).trim()) {
        return c.json({ error: 'Invalid code', debug: { dbCode: record.code, userCode: code, dbType: typeof record.code, userType: typeof code } }, 400);
    }

    // Step 3: Check expiry
    if (new Date(record.expires_at) < new Date()) {
        return c.json({ error: 'Code expired. Please request a new one.' }, 400);
    }

    // Step 4: Create or fix user account and sign in
    const DEMO_PASSWORD = Deno.env.get('BACKEND_USER_PASSWORD') || 'deal-shield-demo-pw-2024';

    // Try to sign in first
    let signInResult = await supabase.auth.signInWithPassword({
        email: email,
        password: DEMO_PASSWORD
    });

    if (signInResult.error) {
        console.log('[OTP-VERIFY] Sign-in failed:', signInResult.error.message);

        // Try to create user first
        const createResult = await supabase.auth.admin.createUser({
            email: email,
            password: DEMO_PASSWORD,
            email_confirm: true
        });

        if (createResult.error) {
            console.log('[OTP-VERIFY] Create failed:', createResult.error.message);

            // User already exists but wrong password -> force reset password
            if (createResult.error.message.includes('already')) {
                console.log('[OTP-VERIFY] User exists, resetting password...');
                const { data: { users } } = await supabase.auth.admin.listUsers();
                const existingUser = users?.find((u: any) => u.email === email);

                if (existingUser) {
                    const updateResult = await supabase.auth.admin.updateUserById(
                        existingUser.id,
                        { password: DEMO_PASSWORD, email_confirm: true }
                    );
                    if (updateResult.error) {
                        console.error('[OTP-VERIFY] Password reset failed:', updateResult.error);
                        return c.json({ error: 'Account fix failed' }, 500);
                    }
                    console.log('[OTP-VERIFY] Password reset successful for', existingUser.id);
                } else {
                    return c.json({ error: 'User state error' }, 500);
                }
            } else {
                return c.json({ error: createResult.error.message }, 400);
            }
        } else {
            console.log('[OTP-VERIFY] User created successfully:', createResult.data.user?.id);
        }

        // Retry sign in after create/fix
        signInResult = await supabase.auth.signInWithPassword({
            email: email,
            password: DEMO_PASSWORD
        });

        if (signInResult.error) {
            console.error('[OTP-VERIFY] Retry sign-in failed:', signInResult.error);
            return c.json({ error: 'Login failed: ' + signInResult.error.message }, 500);
        }
    }

    if (!signInResult.data.session) {
        return c.json({ error: 'No session created' }, 500);
    }

    console.log('[OTP-VERIFY] Login successful for', email);

    // Step 5: Delete used code
    await supabase.from('verification_codes').delete().eq('email', email);

    return c.json({
        token: signInResult.data.session.access_token,
        refreshToken: signInResult.data.session.refresh_token,
        user: {
            id: signInResult.data.user?.id,
            email: signInResult.data.user?.email
        }
    });
});

// Admin Password Login
app.post('/auth/admin/login', async (c) => {
    const { password } = await c.req.json();
    if (!password) return c.json({ error: 'Password required' }, 400);

    // Check admin password
    if (password !== 'admin2026') {
        return c.json({ error: 'Invalid admin password' }, 401);
    }

    const ADMIN_EMAIL = 'admin@dealshield.pro';
    const ADMIN_PASSWORD = 'admin-dealshield-2026-secret';

    // Create or sign in admin user
    let signInResult = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
    });

    if (signInResult.error) {
        // Create admin user
        const createResult = await supabase.auth.admin.createUser({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            email_confirm: true,
            user_metadata: { role: 'admin', full_name: 'Admin Pro' }
        });

        if (createResult.error && createResult.error.message.includes('already')) {
            // User exists, reset password and set admin role
            const { data: { users } } = await supabase.auth.admin.listUsers();
            const adminUser = users?.find((u: any) => u.email === ADMIN_EMAIL);
            if (adminUser) {
                await supabase.auth.admin.updateUserById(adminUser.id, {
                    password: ADMIN_PASSWORD,
                    email_confirm: true,
                    user_metadata: { role: 'admin', full_name: 'Admin Pro' }
                });
            }
        }

        // Retry sign in
        signInResult = await supabase.auth.signInWithPassword({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });

        if (signInResult.error) {
            return c.json({ error: 'Admin login failed: ' + signInResult.error.message }, 500);
        }
    }

    if (!signInResult.data.session) {
        return c.json({ error: 'No session created' }, 500);
    }

    // Ensure admin role is set in metadata
    await supabase.auth.admin.updateUserById(signInResult.data.user!.id, {
        user_metadata: { role: 'admin', full_name: 'Admin Pro' }
    });

    return c.json({
        token: signInResult.data.session.access_token,
        refreshToken: signInResult.data.session.refresh_token,
        user: {
            id: signInResult.data.user?.id,
            email: signInResult.data.user?.email,
            role: 'admin'
        }
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

    const fileId = `uploads/${user.id}/${crypto.randomUUID()}.pdf`; // Using .pdf as default extension for simplicity, or we could pass extension from frontend
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

    // 1. Get Signed URL for Gemini to read
    const { data: signedData, error: signedError } = await supabase.storage
        .from('deal_files')
        .createSignedUrl(fileId, 600); // 10 mins

    if (signedError || !signedData?.signedUrl) {
        return c.json({ error: 'Could not access file' }, 500);
    }

    // 2. Call Gemini for parsing
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) return c.json({ error: 'Server misconfigured (Missing AI Key)' }, 500);

    // Fetch file content to base64 for Gemini
    const fileRes = await fetch(signedData.signedUrl);
    const fileBlob = await fileRes.blob();
    const arrayBuffer = await fileBlob.arrayBuffer();
    const base64File = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = fileBlob.type || 'application/pdf';

    const prompt = `
    You are an expert OCR for car dealership documents. 
    Analyze this Buyer's Order / Deal Sheet.
    Extract the following fields accurately.
    Return ONLY valid JSON.
    Structure:
    {
        "vehicle": "Year Make Model Trim",
        "price": number (Selling Price/MSRP),
        "fees": { "doc_fee": number, "prep_fee": number, "gps": number, "other_add_ons": number },
        "vin": "string",
        "mileage": number,
        "otd_price": number (Out the Door Price / Total Cash Price)
    }
    If a field is missing, use null or 0.
    `;

    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inline_data: {
                            mime_type: mimeType,
                            data: base64File
                        }
                    }
                ]
            }]
        })
    });

    const aiJson = await aiRes.json();
    let extracted;

    try {
        const text = aiJson.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const jsonStr = text.replace(/^```json\n|\n```$/g, "").trim();
        extracted = JSON.parse(jsonStr);
    } catch (e) {
        console.error("Gemini Parse Error", e, JSON.stringify(aiJson));
        // Fallback or error
        return c.json({ error: "Could not parse document. Please ensure it is a clear image of a deal sheet." }, 400);
    }

    // 3. Construct preview
    const preview = {
        vehicle_name: extracted.vehicle || "Unknown Vehicle",
        price: extracted.otd_price ? `$${extracted.otd_price.toLocaleString()}` : (extracted.price ? `$${extracted.price.toLocaleString()}` : "N/A"),
        mileage: extracted.mileage ? extracted.mileage.toLocaleString() : "N/A"
    };

    // 4. Save to DB
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
    if (!priceId) return c.json({ error: 'Server misconfigured (Missing Stripe Price ID)' }, 500);

    const frontendUrl = FRONTEND_ORIGIN || c.req.header('Origin') || c.req.header('Referer')?.replace(/\/[^/]*$/, '') || 'http://localhost:3000';
    const session = await stripe.checkout.sessions.create({
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'payment',
        success_url: `${frontendUrl}/report/${dealId}?success=1`,
        cancel_url: `${frontendUrl}/paywall/${dealId}?canceled=1`,
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

    // 1. Verify Payment (skip for admin users)
    const { data: deal } = await supabase.from('deals').select('*').eq('id', dealId).single();
    const isAdmin = user.user_metadata?.role === 'admin';
    if (!isAdmin && !deal?.paid) return c.json({ requiresPayment: true });

    // 2. Check Cache
    const { data: existingReport } = await supabase.from('reports').select('*').eq('deal_id', dealId).single();
    if (existingReport) {
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
    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
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
        const jsonStr = text.replace(/^```json\n|\n```$/g, "").trim();
        reportData = JSON.parse(jsonStr);
    } catch (e) {
        console.error("Gemini Parse Error", e, JSON.stringify(aiJson));
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
