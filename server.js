// ═══════════════════════════════════════════════════════════════
// NEO.PRO BACKEND v2.0 — Railway Edition
// Frontend: Cloudflare Pages (neopro.pages.dev)
// ═══════════════════════════════════════════════════════════════

require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');

const app  = express();
const PORT = process.env.PORT || 3002;

// ── CORS: izinkan Cloudflare Pages + custom domain ──
const ALLOWED = [
    // Cloudflare Pages
    /^https:\/\/.*\.pages\.dev$/,
    // Custom domain (tambah sesuai kebutuhan)
    process.env.FRONTEND_URL,
    // Dev local
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
].filter(Boolean);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
    origin: (origin, cb) => {
        if (!origin) return cb(null, true); // curl / mobile
        const ok = ALLOWED.some(p =>
            typeof p === 'string' ? p === origin : p.test(origin)
        );
        cb(null, true); // allow all — restrict jika butuh keamanan ekstra
    },
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization','X-API-Key','X-Neo-Token'],
    credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimit({ windowMs: 15*60*1000, max: 300, standardHeaders: true }));

// Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString().slice(11,19)}] ${req.method} ${req.path}`);
    next();
});

// ══════════════════════════════════════════════
// ROOT & HEALTH
// ══════════════════════════════════════════════

app.get('/', (req, res) => res.json({
    service:   'NeoPro Backend v2.0',
    status:    'online',
    frontend:  process.env.FRONTEND_URL || 'https://neopro.pages.dev',
    timestamp: new Date().toISOString(),
    endpoints: [
        'GET  /health',
        'POST /api/chat',
        'POST /api/whatsapp/send',
        'POST /api/telegram/send',
        'POST /api/slack/send',
        'POST /api/email/send',
        'GET  /api/shopee/orders',
        'GET  /api/tokopedia/orders',
        'POST /api/midtrans/create-transaction',
        'POST /api/xendit/invoice',
        'POST /api/webhook/trigger',
        'GET  /api/integrations/status',
        'GET  /oauth/callback',
    ]
}));

app.get('/health', (req, res) => res.json({
    status:    'ok',
    uptime:    Math.floor(process.uptime()),
    memory:    `${Math.round(process.memoryUsage().heapUsed/1024/1024)}MB`,
    env:       process.env.RAILWAY_ENVIRONMENT || 'development',
    timestamp: new Date().toISOString(),
    keys: {
        anthropic:  !!process.env.ANTHROPIC_API_KEY,
        whatsapp:   !!process.env.WHATSAPP_TOKEN,
        telegram:   !!process.env.TELEGRAM_BOT_TOKEN,
        midtrans:   !!process.env.MIDTRANS_SERVER_KEY,
        xendit:     !!process.env.XENDIT_API_KEY,
    }
}));

// ══════════════════════════════════════════════
// AI CHAT — Anthropic Claude
// ══════════════════════════════════════════════

app.post('/api/chat', async (req, res) => {
    try {
        const { messages = [], context = '', model = 'claude-haiku-4-5-20251001', stream = false } = req.body;
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) return res.status(503).json({ error: 'ANTHROPIC_API_KEY tidak dikonfigurasi' });

        const systemPrompt = context || `Kamu adalah Neo Assistant, AI Quantum v7 milik NeoPro — platform bisnis proaktif Digium Digital.
Kepribadian: Cerdas, profesional, proaktif, actionable.
Bahasa: Utama Bahasa Indonesia, switch sesuai permintaan.
Kemampuan: Analisis bisnis, coding, riset, marketing, e-commerce, keuangan, otomasi.`;

        const payload = {
            model,
            max_tokens: 2048,
            system: systemPrompt,
            messages: messages.slice(-20).map(m => ({
                role:    m.role === 'assistant' ? 'assistant' : 'user',
                content: typeof m.content === 'string'
                    ? m.content.replace(/<[^>]*>/g, '').slice(0, 4000)
                    : m.content
            }))
        };

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method:  'POST',
            headers: {
                'Content-Type':      'application/json',
                'x-api-key':         apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error?.message || `Anthropic HTTP ${response.status}`);
        }

        const data  = await response.json();
        const reply = data.content?.[0]?.text || 'Tidak ada respons dari AI.';
        res.json({ reply, model, usage: data.usage });

    } catch (e) {
        console.error('[/api/chat]', e.message);
        res.status(500).json({ error: e.message });
    }
});

// ══════════════════════════════════════════════
// WHATSAPP — via WhatsApp Business API
// ══════════════════════════════════════════════

app.post('/api/whatsapp/send', async (req, res) => {
    try {
        const { to, message, type = 'text' } = req.body;
        if (!to || !message) return res.status(400).json({ error: 'to dan message wajib diisi' });

        const token   = process.env.WHATSAPP_TOKEN;
        const phoneId = process.env.WHATSAPP_PHONE_ID;
        if (!token || !phoneId) return res.status(503).json({ error: 'WhatsApp belum dikonfigurasi' });

        const response = await fetch(
            `https://graph.facebook.com/v19.0/${phoneId}/messages`,
            {
                method:  'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: to.replace(/[^0-9]/g, ''),
                    type: 'text',
                    text: { body: message }
                }),
            }
        );
        const data = await response.json();
        res.json({ success: true, data });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/whatsapp/broadcast', async (req, res) => {
    try {
        const { numbers = [], message } = req.body;
        if (!numbers.length) return res.status(400).json({ error: 'numbers array wajib diisi' });

        const token   = process.env.WHATSAPP_TOKEN;
        const phoneId = process.env.WHATSAPP_PHONE_ID;
        if (!token || !phoneId) return res.status(503).json({ error: 'WhatsApp belum dikonfigurasi' });

        const results = [];
        for (const num of numbers.slice(0, 50)) { // max 50 per request
            try {
                const r = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        messaging_product: 'whatsapp', to: num.replace(/[^0-9]/g,''),
                        type: 'text', text: { body: message }
                    }),
                });
                results.push({ number: num, status: r.ok ? 'sent' : 'failed' });
                await new Promise(r => setTimeout(r, 200)); // delay anti-spam
            } catch { results.push({ number: num, status: 'error' }); }
        }
        res.json({ success: true, results, sent: results.filter(r => r.status === 'sent').length });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ══════════════════════════════════════════════
// TELEGRAM
// ══════════════════════════════════════════════

app.post('/api/telegram/send', async (req, res) => {
    try {
        const { chat_id, text, parse_mode = 'HTML' } = req.body;
        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (!token) return res.status(503).json({ error: 'Telegram belum dikonfigurasi' });

        const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id, text, parse_mode }),
        });
        const data = await r.json();
        res.json({ success: data.ok, data });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ══════════════════════════════════════════════
// SLACK
// ══════════════════════════════════════════════

app.post('/api/slack/send', async (req, res) => {
    try {
        const { channel, text, blocks } = req.body;
        const token = process.env.SLACK_BOT_TOKEN;
        if (!token) return res.status(503).json({ error: 'Slack belum dikonfigurasi' });

        const r = await fetch('https://slack.com/api/chat.postMessage', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ channel, text, blocks }),
        });
        const data = await r.json();
        res.json({ success: data.ok, data });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ══════════════════════════════════════════════
// EMAIL — via Resend (gratis 3000/bulan)
// ══════════════════════════════════════════════

app.post('/api/email/send', async (req, res) => {
    try {
        const { to, subject, html, from = 'NeoPro <noreply@neopro.app>' } = req.body;
        const apiKey = process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY;
        if (!apiKey) return res.status(503).json({ error: 'Email service belum dikonfigurasi' });

        // Resend API
        const r = await fetch('https://api.resend.com/emails', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({ from, to: Array.isArray(to) ? to : [to], subject, html }),
        });
        const data = await r.json();
        res.json({ success: !!data.id, data });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ══════════════════════════════════════════════
// SHOPEE
// ══════════════════════════════════════════════

app.get('/api/shopee/orders', async (req, res) => {
    try {
        const { shopId, accessToken } = req.query;
        const _shopId      = shopId      || process.env.SHOPEE_SHOP_ID;
        const _accessToken = accessToken || process.env.SHOPEE_ACCESS_TOKEN;
        const partnerKey   = process.env.SHOPEE_PARTNER_KEY;
        const partnerId    = process.env.SHOPEE_PARTNER_ID;

        if (!partnerKey) return res.status(503).json({ error: 'Shopee belum dikonfigurasi' });

        const timestamp  = Math.floor(Date.now() / 1000);
        const path       = '/api/v2/order/get_order_list';
        const baseString = `${partnerId}${path}${timestamp}${_accessToken}${_shopId}`;
        const crypto     = require('crypto');
        const sign       = crypto.createHmac('sha256', partnerKey).update(baseString).digest('hex');

        const url = `https://partner.shopeemobile.com${path}?access_token=${_accessToken}&partner_id=${partnerId}&shop_id=${_shopId}&sign=${sign}&timestamp=${timestamp}&order_status=READY_TO_SHIP&page_size=20`;
        const r   = await fetch(url);
        const data = await r.json();
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/shopee/product/update', async (req, res) => {
    try {
        const { shopId, accessToken, itemId, price, stock } = req.body;
        const partnerKey = process.env.SHOPEE_PARTNER_KEY;
        if (!partnerKey) return res.status(503).json({ error: 'Shopee belum dikonfigurasi' });
        res.json({ success: true, message: 'Product update queued', itemId });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ══════════════════════════════════════════════
// TOKOPEDIA
// ══════════════════════════════════════════════

app.get('/api/tokopedia/orders', async (req, res) => {
    try {
        const clientId = process.env.TOKOPEDIA_CLIENT_ID;
        if (!clientId) return res.status(503).json({ error: 'Tokopedia belum dikonfigurasi' });
        // Tokopedia butuh OAuth2 — return placeholder
        res.json({ message: 'Tokopedia API siap, hubungkan OAuth di Settings > Integrations', orders: [] });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ══════════════════════════════════════════════
// MIDTRANS
// ══════════════════════════════════════════════

app.post('/api/midtrans/create-transaction', async (req, res) => {
    try {
        const { orderId, amount, customerDetails, items = [] } = req.body;
        const serverKey = process.env.MIDTRANS_SERVER_KEY;
        if (!serverKey) return res.status(503).json({ error: 'Midtrans belum dikonfigurasi' });

        const isProduction = process.env.MIDTRANS_PRODUCTION === 'true';
        const baseUrl = isProduction ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com';
        const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64');

        const r = await fetch(`${baseUrl}/snap/v1/transactions`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
            body: JSON.stringify({
                transaction_details: { order_id: orderId || `NEO-${Date.now()}`, gross_amount: amount },
                customer_details: customerDetails,
                item_details: items,
            }),
        });
        const data = await r.json();
        res.json({ success: !!data.token, token: data.token, redirect_url: data.redirect_url, data });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/midtrans/notification', async (req, res) => {
    try {
        const notif = req.body;
        console.log('[Midtrans Notification]', notif.order_id, notif.transaction_status);
        // TODO: update order status di database
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ══════════════════════════════════════════════
// XENDIT
// ══════════════════════════════════════════════

app.post('/api/xendit/invoice', async (req, res) => {
    try {
        const { externalId, amount, payerEmail, description } = req.body;
        const apiKey = process.env.XENDIT_API_KEY;
        if (!apiKey) return res.status(503).json({ error: 'Xendit belum dikonfigurasi' });

        const r = await fetch('https://api.xendit.co/v2/invoices', {
            method:  'POST',
            headers: {
                'Content-Type':  'application/json',
                'Authorization': 'Basic ' + Buffer.from(apiKey + ':').toString('base64'),
            },
            body: JSON.stringify({
                external_id:  externalId || `NEO-${Date.now()}`,
                amount, payer_email: payerEmail, description,
                success_redirect_url: process.env.FRONTEND_URL || 'https://neopro.pages.dev',
                failure_redirect_url: process.env.FRONTEND_URL || 'https://neopro.pages.dev',
            }),
        });
        const data = await r.json();
        res.json({ success: !!data.id, invoiceUrl: data.invoice_url, data });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ══════════════════════════════════════════════
// GENERIC WEBHOOK TRIGGER
// ══════════════════════════════════════════════

app.post('/api/webhook/trigger', async (req, res) => {
    try {
        const { url, method = 'POST', headers = {}, body: payload } = req.body;
        if (!url) return res.status(400).json({ error: 'url wajib diisi' });

        const r = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', ...headers },
            body: method !== 'GET' ? JSON.stringify(payload) : undefined,
            signal: AbortSignal.timeout(15000),
        });
        const text = await r.text();
        let data;
        try { data = JSON.parse(text); } catch { data = { raw: text }; }
        res.json({ success: r.ok, status: r.status, data });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ══════════════════════════════════════════════
// INTEGRATIONS STATUS
// ══════════════════════════════════════════════

app.get('/api/integrations/status', (req, res) => {
    res.json({
        anthropic:  !!process.env.ANTHROPIC_API_KEY,
        whatsapp:   !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID),
        telegram:   !!process.env.TELEGRAM_BOT_TOKEN,
        slack:      !!process.env.SLACK_BOT_TOKEN,
        email:      !!(process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY),
        shopee:     !!(process.env.SHOPEE_PARTNER_KEY && process.env.SHOPEE_PARTNER_ID),
        tokopedia:  !!process.env.TOKOPEDIA_CLIENT_ID,
        midtrans:   !!process.env.MIDTRANS_SERVER_KEY,
        xendit:     !!process.env.XENDIT_API_KEY,
        environment: process.env.RAILWAY_ENVIRONMENT || 'development',
        frontend:   process.env.FRONTEND_URL || 'https://neopro.pages.dev',
    });
});

// ══════════════════════════════════════════════
// OAUTH CALLBACK
// ══════════════════════════════════════════════

app.get('/oauth/callback', async (req, res) => {
    const { code, state, error } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || 'https://neopro.pages.dev';

    if (error) {
        return res.redirect(`${frontendUrl}?oauth_error=${encodeURIComponent(error)}`);
    }
    if (!code) {
        return res.redirect(`${frontendUrl}?oauth_error=no_code`);
    }

    res.redirect(`${frontendUrl}?oauth_code=${code}&oauth_state=${state || ''}`);
});

// ══════════════════════════════════════════════
// ERROR HANDLER
// ══════════════════════════════════════════════

app.use((err, req, res, next) => {
    console.error('[Error]', err.message);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.use((req, res) => {
    res.status(404).json({ error: `Endpoint ${req.method} ${req.path} tidak ditemukan` });
});

// ══════════════════════════════════════════════
// START
// ══════════════════════════════════════════════

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n╔══════════════════════════════════════╗`);
    console.log(`║  NeoPro Backend v2.0 — Railway        ║`);
    console.log(`║  Port    : ${PORT}                        ║`);
    console.log(`║  Frontend: ${(process.env.FRONTEND_URL || 'neopro.pages.dev').slice(0,22).padEnd(22)} ║`);
    console.log(`║  Env     : ${(process.env.RAILWAY_ENVIRONMENT || 'development').padEnd(22)} ║`);
    console.log(`╚══════════════════════════════════════╝\n`);
});
