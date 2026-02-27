// ═══════════════════════════════════════════════════════════════
// NEO.PRO BACKEND v2.0 — Railway Edition
// Frontend: Cloudflare Pages (neopro.pages.dev)
// ═══════════════════════════════════════════════════════════════

require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
const fetch     = require('node-fetch'); // ✅ explicit import untuk kompatibilitas

const app  = express();
app.set('trust proxy', 1); // Required for Railway reverse proxy
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
        'GET  /api/ai/test',
        'POST /api/chat',
        'POST /api/ai/chat',
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

// ════════════════════════════════════════════════════════════════
// NEO RESEARCH AGENT — Deep Multi-Source Research Engine
// Kategori: KDP, POD, Microstock, Digital Product + Skill Market
// ════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════
// NEO RESEARCH AGENT — Deep Multi-Source Research Engine
// Kategori: KDP, POD, Microstock, Digital Product + Skill Market
// ════════════════════════════════════════════════════════════════

// ── Template riset per kategori bisnis ──
const RESEARCH_TEMPLATES = {

    kdp: {
        label: 'KDP (Kindle Direct Publishing)',
        emoji: '📚',
        queries: (topic) => [
            `KDP low content book trending niche ${topic} ${new Date().getFullYear()}`,
            `Amazon KDP best selling ${topic} keywords royalty`,
            `KDP no content book profitable ${topic} competition analysis`,
            `self publishing ${topic} revenue passive income strategy`,
            `KDP interior template ${topic} canva design tips`
        ],
        systemContext: `Kamu ahli KDP (Kindle Direct Publishing) Amazon. 
Fokus: analisis niche, keyword research, kompetisi, estimasi royalti, strategi listing.
Berikan data konkret: BSR (Best Seller Rank), estimasi penjualan/bulan, harga optimal.`
    },

    pod: {
        label: 'POD (Print on Demand)',
        emoji: '👕',
        queries: (topic) => [
            `print on demand trending design ${topic} ${new Date().getFullYear()}`,
            `Redbubble Merch Amazon Teepublic best seller ${topic} niche`,
            `POD profitable niche ${topic} competition low high demand`,
            `print on demand design ideas trending ${topic} etsy`,
            `POD business strategy ${topic} marketing tips revenue`
        ],
        systemContext: `Kamu ahli Print on Demand (Redbubble, Merch by Amazon, Teepublic, Printify, Printful).
Fokus: trending design niche, kompetisi platform, estimasi earning, tips upload massal.
Berikan insight: niche yang underserved, tag optimal, strategi pricing.`
    },

    microstock: {
        label: 'Microstock',
        emoji: '📸',
        queries: (topic) => [
            `microstock best selling ${topic} Shutterstock Adobe Stock Getty ${new Date().getFullYear()}`,
            `stock photo video trending ${topic} high demand low competition`,
            `microstock contributor earnings ${topic} portfolio tips`,
            `Shutterstock on demand ${topic} keyword research strategy`,
            `microstock AI generated ${topic} accepted rejected policy`
        ],
        systemContext: `Kamu ahli Microstock (Shutterstock, Adobe Stock, Getty, iStock, Alamy, Pond5).
Fokus: trending content, keyword strategy, acceptance rate, estimasi royalti per download.
Berikan data: kategori paling laku, tips metadata, strategi portofolio.`
    },

    digital: {
        label: 'Digital Product',
        emoji: '💾',
        queries: (topic) => [
            `digital product best selling ${topic} Etsy Gumroad ${new Date().getFullYear()}`,
            `digital download profitable niche ${topic} passive income`,
            `${topic} digital template canva notion spreadsheet selling`,
            `digital product marketing ${topic} email list social media strategy`,
            `Etsy digital product ${topic} SEO tags description optimize`
        ],
        systemContext: `Kamu ahli Digital Product (Etsy, Gumroad, Payhip, Creative Market).
Fokus: produk yang laku, platform terbaik, strategi pricing, marketing organik.
Berikan data: estimasi revenue, niche populer, tips SEO per platform.`
    },

    bisnis: {
        label: 'Analisis Bisnis',
        emoji: '📊',
        queries: (topic) => [
            `${topic} business analysis market trend Indonesia ${new Date().getFullYear()}`,
            `${topic} competitor analysis SWOT strategy`,
            `${topic} target market customer persona Indonesia`,
            `${topic} revenue model pricing strategy`,
            `${topic} digital marketing strategy ROI Indonesia`
        ],
        systemContext: `Kamu konsultan bisnis senior dengan expertise pasar Indonesia.
Fokus: analisis pasar, kompetitor, peluang, strategi go-to-market.
Berikan insight actionable dengan data konkret dan langkah implementasi.`
    },

    marketing: {
        label: 'Marketing & Konten',
        emoji: '📣',
        queries: (topic) => [
            `${topic} marketing strategy social media trend ${new Date().getFullYear()}`,
            `${topic} content marketing viral Indonesia TikTok Instagram`,
            `${topic} SEO keyword research Google Indonesia`,
            `${topic} ads Facebook Google performance benchmark`,
            `${topic} influencer marketing UGC strategy Indonesia`
        ],
        systemContext: `Kamu digital marketing expert spesialis pasar Indonesia.
Fokus: strategi konten, iklan berbayar, SEO, influencer, conversion optimization.
Berikan data: CPM/CPC benchmark, engagement rate, platform terbaik.`
    },

    riset: {
        label: 'Riset Umum',
        emoji: '🔬',
        queries: (topic) => [
            `${topic} research data statistics ${new Date().getFullYear()}`,
            `${topic} latest news update trend`,
            `${topic} expert opinion analysis report`,
            `${topic} Indonesia market opportunity`,
            `${topic} how to guide best practice`
        ],
        systemContext: `Kamu research analyst yang memberikan data komprehensif dan akurat.
Berikan: data statistik, sumber terpercaya, analisis tren, kesimpulan actionable.`
    }
};

// Deteksi kategori riset dari pesan user
function detectResearchCategory(msg) {
    const m = msg.toLowerCase();
    if (m.match(/kdp|kindle|low content|no content|amazon book|self publish/)) return 'kdp';
    if (m.match(/pod|print on demand|merch|redbubble|teepublic|printify|kaos|baju/)) return 'pod';
    if (m.match(/microstock|shutterstock|adobe stock|getty|stock photo|stock video|contributor/)) return 'microstock';
    if (m.match(/digital product|digital download|template|canva template|notion|gumroad|etsy/)) return 'digital';
    if (m.match(/marketing|konten|content|iklan|ads|seo|sosmed|tiktok|instagram/)) return 'marketing';
    if (m.match(/riset|research|analisis|cari data|data tentang|info tentang|trend/)) return 'riset';
    return 'bisnis'; // default
}

const SERPER_KEY    = process.env.SERPER_API_KEY || '';
const BRAVE_KEY     = process.env.BRAVE_API_KEY  || '';

// Web search via Serper.dev (Google)
async function searchSerper(query) {
    if (!SERPER_KEY) return null;
    try {
        const r = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-API-KEY': SERPER_KEY },
            signal: AbortSignal.timeout(8000),
            body: JSON.stringify({ q: query, gl: 'id', hl: 'id', num: 5 })
        });
        if (!r.ok) return null;
        const data = await r.json();

        // Format hasil pencarian
        const results = [];

        // Knowledge graph (kotak info di kanan Google)
        if (data.knowledgeGraph) {
            const kg = data.knowledgeGraph;
            results.push(`📌 ${kg.title || ''}: ${kg.description || kg.descriptionShort || ''}`);
        }

        // Answer box (jawaban langsung Google)
        if (data.answerBox) {
            const ab = data.answerBox;
            const ans = ab.answer || ab.snippet || ab.snippetHighlighted?.join(' ') || '';
            if (ans) results.push(`✅ Jawaban langsung: ${ans}`);
        }

        // Organic results (top 4)
        if (data.organic) {
            data.organic.slice(0, 4).forEach((item, i) => {
                results.push(`[${i+1}] ${item.title}
    ${item.snippet}
    Sumber: ${item.link}`);
            });
        }

        return results.length > 0 ? results.join('\n\n') : null;
    } catch (e) {
        console.warn('[Search/Serper]', e.message);
        return null;
    }
}

// Web search via Brave Search API (fallback)
async function searchBrave(query) {
    if (!BRAVE_KEY) return null;
    try {
        const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5&country=ID&search_lang=id`;
        const r = await fetch(url, {
            headers: { 'Accept': 'application/json', 'X-Subscription-Token': BRAVE_KEY },
            signal: AbortSignal.timeout(8000)
        });
        if (!r.ok) return null;
        const data = await r.json();
        const results = (data.web?.results || []).slice(0, 4).map((item, i) =>
            `[${i+1}] ${item.title}
    ${item.description}
    Sumber: ${item.url}`
        );
        return results.length > 0 ? results.join('\n\n') : null;
    } catch (e) {
        console.warn('[Search/Brave]', e.message);
        return null;
    }
}


// Lakukan riset multi-sumber paralel
async function runDeepResearch(topic, category, maxSources = 4) {
    const template = RESEARCH_TEMPLATES[category] || RESEARCH_TEMPLATES.riset;
    const queries  = template.queries(topic);

    console.log(`[ResearchAgent] 🔬 Mulai riset: "${topic}" | Kategori: ${template.label}`);

    // Jalankan pencarian secara sequential untuk hindari rate limit
    let allData    = [];
    let allSources = [];

    for (let i = 0; i < Math.min(queries.length, maxSources); i++) {
        try {
            const q = queries[i];

            // Coba Serper langsung dulu
            let summary = null;
            if (SERPER_KEY) {
                summary = await searchSerper(q);
                if (summary) console.log(`[ResearchAgent] Serper OK untuk query ${i+1}`);
            }

            // Fallback Brave
            if (!summary && BRAVE_KEY) {
                summary = await searchBrave(q);
                if (summary) console.log(`[ResearchAgent] Brave OK untuk query ${i+1}`);
            }

            // Fallback doWebSearch
            if (!summary) {
                const r = await browseWeb(q, false);
                if (r && r.summary) summary = r.summary;
            }

            if (summary) {
                allData.push(`\n### Query ${i+1}: "${q}"\n${summary}`);
            } else {
                console.log(`[ResearchAgent] ⚠️ Query ${i+1} tidak ada hasil`);
            }
        } catch(e) {
            console.warn(`[ResearchAgent] Query ${i+1} error:`, e.message);
        }
    }

    // Kalau search gagal total, gunakan pengetahuan AI sebagai fallback
    let combinedData = allData.join('\n\n---\n\n');
    if (!combinedData) {
        console.log(`[ResearchAgent] ⚠️ Search kosong, pakai AI knowledge fallback`);
        combinedData = `[Data dari pengetahuan AI - search API tidak mengembalikan hasil untuk topik: "${topic}"]`;
    }

    const uniqueSources = [...new Set(allSources)].slice(0, 6);
    console.log(`[ResearchAgent] ✅ Selesai: ${allData.length} sumber data, ${uniqueSources.length} URL`);

    return {
        topic,
        category,
        categoryLabel: template.label,
        categoryEmoji: template.emoji,
        systemContext: template.systemContext,
        rawData: combinedData,
        sources: uniqueSources,
        queriesUsed: queries.slice(0, maxSources),
        timestamp: new Date().toISOString()
    };
}



// ══════════════════════════════════════════════
// AI CHAT — Anthropic Claude
// ══════════════════════════════════════════════

// ── AI Key pools ──
const GROQ_KEYS   = [process.env.GROQ_API_KEY_1, process.env.GROQ_API_KEY_2, process.env.GROQ_API_KEY_3].filter(Boolean);
const GEMINI_KEYS = [process.env.GEMINI_API_KEY_1, process.env.GEMINI_API_KEY_2, process.env.GEMINI_API_KEY_3].filter(Boolean);
const GROQ_MODEL    = process.env.GROQ_MODEL   || 'llama-3.3-70b-versatile';
const GEMINI_MODEL  = process.env.GEMINI_MODEL || 'gemini-2.5-flash';


// ══════════════════════════════════════════════
// WEB BROWSING AGENT — Neo bisa buka URL apapun
// ══════════════════════════════════════════════

// Bersihkan HTML jadi teks bersih
function stripHtml(html) {
    return html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\s{2,}/g, ' ')
        .trim()
        .slice(0, 4000); // max 4000 char agar tidak overflow context
}

// Fetch & baca isi halaman web manapun
async function fetchWebPage(url) {
    try {
        const r = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; NeoBot/1.0)',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8'
            },
            signal: AbortSignal.timeout(8000),
            redirect: 'follow'
        });
        if (!r.ok) return null;
        const html = await r.text();
        const text = stripHtml(html);
        return text.length > 100 ? text : null;
    } catch (e) {
        console.warn(`[WebFetch] Gagal buka ${url}:`, e.message);
        return null;
    }
}

// DuckDuckGo search — GRATIS tanpa API key
async function searchDuckDuckGo(query) {
    try {
        const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&kl=id-id`;
        const r = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NeoBot/1.0)' },
            signal: AbortSignal.timeout(8000)
        });
        if (!r.ok) return null;
        const html = await r.text();

        // Ekstrak links hasil search dari HTML DuckDuckGo
        const linkRegex = /class="result__url"[^>]*>([^<]+)/g;
        const titleRegex = /class="result__a"[^>]*>([^<]+)/g;
        const snippetRegex = /class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;

        const titles = [...html.matchAll(/class="result__a"[^>]*>([^<]+)/g)].map(m => m[1].trim());
        const urls   = [...html.matchAll(/class="result__url"[^>]*>\s*([^\s<]+)/g)].map(m => {
            let u = m[1].trim();
            if (!u.startsWith('http')) u = 'https://' + u;
            return u;
        });
        const snippets = [...html.matchAll(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g)]
            .map(m => m[1].replace(/<[^>]+>/g,'').trim());

        const results = titles.slice(0,5).map((title, i) => ({
            title,
            url: urls[i] || '',
            snippet: snippets[i] || ''
        })).filter(r => r.url);

        return results;
    } catch (e) {
        console.warn('[DDG]', e.message);
        return null;
    }
}

// ══ MAIN BROWSING AGENT ══
// Cari + buka halaman + baca konten
async function browseWeb(query, deepRead = false) {
    console.log(`[BrowsingAgent] Mencari: "${query}" | deepRead: ${deepRead}`);

    let searchResults = [];

    // 1. Coba DuckDuckGo dulu (gratis)
    const ddgResults = await searchDuckDuckGo(query);
    if (ddgResults && ddgResults.length > 0) {
        searchResults = ddgResults;
        console.log(`[BrowsingAgent] DDG: ${searchResults.length} hasil`);
    }

    // 2. Fallback ke Serper jika DDG gagal
    if (searchResults.length === 0 && SERPER_KEY) {
        const serperRaw = await searchSerper(query);
        if (serperRaw) {
            return { summary: serperRaw, sources: [], method: 'serper' };
        }
    }

    if (searchResults.length === 0) {
        return null;
    }

    // 3. Format ringkas dari snippet dulu
    let output = `🔍 Hasil pencarian untuk: "${query}"

`;
    searchResults.forEach((r, i) => {
        output += `[${i+1}] ${r.title}\n`;
        if (r.snippet) output += `    ${r.snippet}\n`;
        if (r.url) output += `    🔗 ${r.url}\n`;
        output += '\n';
    });

    // 4. deepRead: buka & baca isi halaman teratas
    if (deepRead && searchResults[0]?.url) {
        console.log(`[BrowsingAgent] Deep reading: ${searchResults[0].url}`);
        const pageContent = await fetchWebPage(searchResults[0].url);
        if (pageContent) {
            output += `
📄 ISI HALAMAN TERATAS (${searchResults[0].url}):
${pageContent}`;
        }
    }

    return {
        summary: output,
        sources: searchResults.map(r => r.url).filter(Boolean),
        method: 'browsing-agent'
    };
}

let groqKeyIdx   = 0;
let geminiKeyIdx = 0;

// ══════════════════════════════════════════════
// WEB SEARCH — Serper (Google) + Brave fallback
// ══════════════════════════════════════════════

// Deteksi apakah pesan butuh search internet
function needsWebSearch(msg) {
    const m = msg.toLowerCase();
    // Kata kunci yang butuh data realtime
    const triggers = [
        // Waktu/berita
        'berita','news','terbaru','terkini','hari ini','sekarang','minggu ini','bulan ini',
        'update','trending','viral','breaking',
        // Harga/keuangan
        'harga','price','kurs','dollar','bitcoin','saham','ihsg','bbm','bensin','emas',
        'crypto','ethereum','nilai tukar','inflasi','suku bunga',
        // Cuaca
        'cuaca','weather','hujan','suhu','temperatur','prakiraan',
        // Info umum realtime
        'siapa ceo','siapa presiden','siapa menteri','jadwal','libur nasional',
        'kurs rupiah','kurs usd','kurs sgd',
        // Produk/bisnis
        'review','spesifikasi','spec','kompetitor','market share','tren bisnis',
        // Cari/temukan
        'carikan','cari','temukan','cek','search','googling','browsing',
        'info tentang','data tentang','berapa','kapan','dimana','siapa'
    ];
    return triggers.some(t => m.includes(t));
}


// Main search function dengan fallback
async function doWebSearch(query) {
    console.log(`[WebSearch] Query: "${query}"`);
    let result = await searchSerper(query);
    if (!result && BRAVE_KEY) {
        console.log('[WebSearch] Serper gagal/tidak ada key, coba Brave...');
        result = await searchBrave(query);
    }
    if (result) {
        console.log('[WebSearch] ✅ Hasil ditemukan');
    } else {
        console.log('[WebSearch] ❌ Tidak ada hasil (pastikan SERPER_API_KEY atau BRAVE_API_KEY diset)');
    }
    return result;
}

async function callGroq(messages, systemPrompt) {
    for (let attempt = 0; attempt < GROQ_KEYS.length; attempt++) {
        const key = GROQ_KEYS[groqKeyIdx % GROQ_KEYS.length];
        groqKeyIdx++;
        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
                signal: AbortSignal.timeout(15000), // ✅ 15 detik timeout
                body: JSON.stringify({
                    model: GROQ_MODEL,
                    max_tokens: 1024, // ✅ dikurangi dari 2048 → lebih cepat
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...messages.slice(-20).map(m => ({
                            role: m.role === 'assistant' ? 'assistant' : 'user',
                            content: typeof m.content === 'string' ? m.content.replace(/<[^>]*>/g, '').slice(0, 4000) : m.content
                        }))
                    ]
                })
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error?.message || `GROQ HTTP ${response.status}`);
            }
            const data = await response.json();
            return { reply: data.choices?.[0]?.message?.content || 'Tidak ada respons.', provider: 'groq', model: GROQ_MODEL };
        } catch (e) {
            console.warn(`[GROQ key ${attempt+1}] ${e.message}`);
            if (attempt === GROQ_KEYS.length - 1) throw e;
        }
    }
}

async function callGemini(messages, systemPrompt) {
    for (let attempt = 0; attempt < GEMINI_KEYS.length; attempt++) {
        const key = GEMINI_KEYS[geminiKeyIdx % GEMINI_KEYS.length];
        geminiKeyIdx++;
        try {
            const contents = messages.slice(-20).map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: typeof m.content === 'string' ? m.content.replace(/<[^>]*>/g, '').slice(0, 4000) : m.content }]
            }));
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(15000), // ✅ 15 detik timeout
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    contents,
                    generationConfig: { maxOutputTokens: 1024 } // ✅ dikurangi dari 2048
                })
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error?.message || `GEMINI HTTP ${response.status}`);
            }
            const data = await response.json();
            const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Tidak ada respons.';
            return { reply, provider: 'gemini', model: GEMINI_MODEL };
        } catch (e) {
            console.warn(`[GEMINI key ${attempt+1}] ${e.message}`);
            if (attempt === GEMINI_KEYS.length - 1) throw e;
        }
    }
}

app.post('/api/chat', async (req, res) => {
    try {
        const { messages = [], context = '' } = req.body;
        const systemPrompt = context || `Kamu adalah Neo Assistant, AI Quantum v7 milik NeoPro — platform bisnis proaktif Digium Digital.
Kepribadian: Cerdas, profesional, proaktif, actionable.
Bahasa: Utama Bahasa Indonesia, switch sesuai permintaan.
Kemampuan: Analisis bisnis, coding, riset, marketing, e-commerce, keuangan, otomasi.`;

        let result;
        if (GROQ_KEYS.length > 0) {
            try {
                result = await callGroq(messages, systemPrompt);
                console.log(`[/api/chat] Provider: GROQ`);
            } catch (groqErr) {
                console.warn(`[/api/chat] GROQ gagal semua, switch ke GEMINI. Error: ${groqErr.message}`);
                if (GEMINI_KEYS.length > 0) {
                    result = await callGemini(messages, systemPrompt);
                    console.log(`[/api/chat] Provider: GEMINI (fallback)`);
                } else {
                    throw new Error('Semua AI provider gagal dan tidak ada GEMINI key.');
                }
            }
        } else if (GEMINI_KEYS.length > 0) {
            result = await callGemini(messages, systemPrompt);
            console.log(`[/api/chat] Provider: GEMINI`);
        } else {
            return res.status(503).json({ error: 'Tidak ada API key AI yang dikonfigurasi.' });
        }

        res.json(result);

    } catch (e) {
        console.error('[/api/chat]', e.message);
        res.status(500).json({ error: e.message });
    }
});

// ══════════════════════════════════════════════
// AI TEST — cek apakah key valid tanpa kirim chat
// GET https://neoprocore.up.railway.app/api/ai/test
// ══════════════════════════════════════════════

app.get('/api/ai/test', async (req, res) => {
    const groqStatus   = [];
    const geminiStatus = [];

    for (let i = 0; i < GROQ_KEYS.length; i++) {
        try {
            const r = await fetch('https://api.groq.com/openai/v1/models', {
                headers: { 'Authorization': `Bearer ${GROQ_KEYS[i]}` }
            });
            groqStatus.push({ key: `GROQ_KEY_${i+1}`, status: r.ok ? '✅ valid' : `❌ HTTP ${r.status}` });
        } catch (e) {
            groqStatus.push({ key: `GROQ_KEY_${i+1}`, status: `❌ ${e.message}` });
        }
    }

    for (let i = 0; i < GEMINI_KEYS.length; i++) {
        try {
            const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_KEYS[i]}`);
            geminiStatus.push({ key: `GEMINI_KEY_${i+1}`, status: r.ok ? '✅ valid' : `❌ HTTP ${r.status}` });
        } catch (e) {
            geminiStatus.push({ key: `GEMINI_KEY_${i+1}`, status: `❌ ${e.message}` });
        }
    }

    res.json({
        groq_model:   GROQ_MODEL,
        gemini_model: GEMINI_MODEL,
        groq_keys:    groqStatus.length > 0 ? groqStatus : ['❌ Tidak ada key'],
        gemini_keys:  geminiStatus.length > 0 ? geminiStatus : ['❌ Tidak ada key'],
    });
});

// ══════════════════════════════════════════════
// AI CHAT ALIAS — /api/ai/chat (dipakai dashboard.html)
// Frontend expect: { response } bukan { reply }
// ══════════════════════════════════════════════

app.post('/api/ai/chat', async (req, res) => {
    try {
        const { message, mode, conversation = [], userContext = {}, clientTime = {} } = req.body;

        if (!message) return res.status(400).json({ error: 'message wajib diisi' });

        const messages = [
            ...conversation.slice(-10).map(m => ({
                role: m.role,
                content: typeof m.content === 'string' ? m.content : ''
            })),
            { role: 'user', content: message }
        ];

        // ✅ Web Browsing Agent — Neo cari & baca internet otomatis
        let webSearchResults = '';
        let webSources = [];
        
        // Deteksi apakah perlu deep read (buka & baca full halaman)
        const deepReadKeywords = ['isi artikel','baca','rangkum','full','detail','lengkap','spesifikasi','spec','review lengkap','harga terbaru'];
        const needsDeepRead = deepReadKeywords.some(k => message.toLowerCase().includes(k));

        if (needsWebSearch(message)) {
            const searchQuery = message.slice(0, 200);
            console.log(`[/api/ai/chat] Browsing agent aktif untuk: "${searchQuery.slice(0,50)}"`);
            
            const browseResult = await browseWeb(searchQuery, needsDeepRead);
            if (browseResult) {
                webSearchResults = browseResult.summary;
                webSources = browseResult.sources;
                console.log(`[/api/ai/chat] ✅ Web data ready via ${browseResult.method}`);
            }
        }

        // ✅ Info user
        const userName  = userContext.name  || (userContext.email || '').split('@')[0] || 'Pengguna';
        const userEmail = userContext.email || 'tidak diketahui';
        const userPlan  = userContext.plan  || 'pro';

        // ✅ Waktu realtime dari server (Railway = UTC+0, konversi ke WIB UTC+7)
        const now = new Date();
        const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
        const HARI = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
        const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

        const realtimeInfo = {
            jamWIB    : wib.toISOString().slice(11,16), // "14:23"
            hariNama  : HARI[wib.getDay()],
            tanggal   : wib.getDate(),
            bulanNama : BULAN[wib.getMonth()],
            bulanNum  : wib.getMonth() + 1,
            tahun     : wib.getFullYear(),
            // Jika client kirim timezone-nya sendiri, pakai itu
            timezone  : clientTime.timezone || 'WIB (UTC+7)',
        };

        // Format lengkap: "Jumat, 28 Februari 2026 · 14:23 WIB"
        const waktuLengkap = `${realtimeInfo.hariNama}, ${realtimeInfo.tanggal} ${realtimeInfo.bulanNama} ${realtimeInfo.tahun} · ${realtimeInfo.jamWIB} WIB`;

        const systemPrompt = `Kamu adalah Neo Assistant, AI Quantum v7 milik NeoPro — platform bisnis proaktif Digium Digital.

═══ WAKTU & TANGGAL REALTIME (AKURAT) ═══
Waktu saat ini : ${waktuLengkap}
Hari           : ${realtimeInfo.hariNama}
Tanggal        : ${realtimeInfo.tanggal} ${realtimeInfo.bulanNama} ${realtimeInfo.tahun}
Jam            : ${realtimeInfo.jamWIB} WIB
Bulan ke-      : ${realtimeInfo.bulanNum}
Tahun          : ${realtimeInfo.tahun}
Timezone       : ${realtimeInfo.timezone}
PENTING: Selalu gunakan data waktu di atas jika user bertanya tentang jam, hari, tanggal, bulan, atau tahun. JANGAN gunakan pengetahuan training untuk waktu.

═══ DATA USER ═══
Nama   : ${userName}
Email  : ${userEmail}
Plan   : NeoPro ${userPlan}
Panggil user dengan nama "${userName}" secara natural.
Jika ditanya email atau identitas, jawab berdasarkan data di atas.

═══ INSTRUKSI ═══
KEPRIBADIAN : Cerdas, profesional, proaktif, actionable, langsung ke inti jawaban.
INGATAN     : Ingat konteks seluruh percakapan dalam sesi ini.
BAHASA      : Utama Bahasa Indonesia, switch sesuai permintaan user.
KEMAMPUAN   : Analisis bisnis, coding, riset, marketing, e-commerce, keuangan, otomasi.
MODE        : ${mode || 'chat'}
${webSearchResults ? `
═══ DATA WEB SEARCH (REALTIME) ═══
Berikut hasil pencarian internet terbaru untuk pertanyaan user.
Gunakan data ini sebagai referensi utama dalam menjawab. Sebutkan sumber jika relevan.

${webSearchResults}

PENTING: Prioritaskan data di atas daripada pengetahuan training jika ada konflik.` : ''}`;

        let result;
        if (GROQ_KEYS.length > 0) {
            try {
                result = await callGroq(messages, systemPrompt);
                console.log(`[/api/ai/chat] Provider: GROQ | Mode: ${mode || 'chat'}`);
            } catch (groqErr) {
                console.warn(`[/api/ai/chat] GROQ gagal, switch ke GEMINI: ${groqErr.message}`);
                if (GEMINI_KEYS.length > 0) {
                    result = await callGemini(messages, systemPrompt);
                    console.log(`[/api/ai/chat] Provider: GEMINI (fallback)`);
                } else {
                    throw new Error('Semua AI provider gagal.');
                }
            }
        } else if (GEMINI_KEYS.length > 0) {
            result = await callGemini(messages, systemPrompt);
            console.log(`[/api/ai/chat] Provider: GEMINI`);
        } else {
            return res.status(503).json({ error: 'Tidak ada API key AI yang dikonfigurasi.' });
        }

        res.json({
            response: result.reply,
            provider: result.provider,
            model:    result.model,
            webSearch: !!webSearchResults,
            sources: webSources.slice(0,3) // kirim max 3 URL sumber ke frontend
        });

    } catch (e) {
        console.error('[/api/ai/chat]', e.message);
        res.status(500).json({ error: e.message, hint: 'Cek Railway Deploy Logs untuk detail' });
    }
});


// ══════════════════════════════════════════════
// RESEARCH AGENT — Deep Multi-Source Research
// POST /api/research
// ══════════════════════════════════════════════

app.post('/api/research', async (req, res) => {
    try {
        const { topic, category: reqCategory, maxSources = 4, userContext = {} } = req.body;
        if (!topic) return res.status(400).json({ error: 'topic wajib diisi' });

        const category = reqCategory || detectResearchCategory(topic);
        const template = RESEARCH_TEMPLATES[category] || RESEARCH_TEMPLATES.riset;

        console.log(`[/api/research] Topic: "${topic}" | Category: ${category}`);

        // Jalankan riset mendalam
        const researchData = await runDeepResearch(topic, category, maxSources);

        if (!researchData.rawData) {
            researchData.rawData = `[Riset untuk: "${topic}" - menggunakan pengetahuan AI]`;
        }

        // Waktu realtime WIB
        const now  = new Date();
        const wib  = new Date(now.getTime() + 7*60*60*1000);
        const HARI = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
        const BULAN= ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
        const waktu= `${HARI[wib.getDay()]}, ${wib.getDate()} ${BULAN[wib.getMonth()]} ${wib.getFullYear()}`;

        const userName = userContext.name || (userContext.email||'').split('@')[0] || 'Pengguna';

        const systemPrompt = `${template.systemContext}

TANGGAL RISET: ${waktu} (realtime)
USER: ${userName}

INSTRUKSI OUTPUT RISET:
Buat laporan riset komprehensif dan actionable dengan struktur:

1. 📊 RINGKASAN EKSEKUTIF (3-4 kalimat insight utama)
2. 🔥 TEMUAN UTAMA (bullet point data penting dari hasil search)
3. 💡 PELUANG & REKOMENDASI (minimal 3 rekomendasi konkret)
4. ⚠️ TANTANGAN & RISIKO (hal yang perlu diwaspadai)
5. 🚀 LANGKAH AKSI (5 langkah implementasi prioritas)
6. 📈 ESTIMASI POTENSI (jika bisa dikira: traffic, revenue, kompetisi)

Gunakan data dari hasil search di bawah sebagai referensi utama.
Bahasa: Indonesia, profesional tapi mudah dipahami.`;

        const messages = [
            { role: 'user', content: `Buatkan laporan riset mendalam tentang: "${topic}"

Kategori: ${template.label}

=== DATA HASIL RISET INTERNET ===
${researchData.rawData}` }
        ];

        // Generate laporan dengan AI
        let result;
        if (GROQ_KEYS.length > 0) {
            try {
                result = await callGroq(messages, systemPrompt);
            } catch {
                if (GEMINI_KEYS.length > 0) result = await callGemini(messages, systemPrompt);
                else throw new Error('Semua AI provider gagal');
            }
        } else if (GEMINI_KEYS.length > 0) {
            result = await callGemini(messages, systemPrompt);
        } else {
            return res.status(503).json({ error: 'Tidak ada AI key' });
        }

        res.json({
            report      : result.reply,
            topic,
            category,
            categoryLabel: template.label,
            categoryEmoji: template.emoji,
            sources     : researchData.sources,
            queriesUsed : researchData.queriesUsed,
            provider    : result.provider,
            timestamp   : researchData.timestamp,
            date        : waktu
        });

    } catch (e) {
        console.error('[/api/research]', e.message);
        res.status(500).json({ error: e.message });
    }
});

// Daily research semua kategori bisnis user
// GET /api/research/daily
app.get('/api/research/daily', async (req, res) => {
    try {
        const topics = [
            { topic: 'KDP low content book trending niche 2025 2026', category: 'kdp' },
            { topic: 'print on demand trending design niche profit', category: 'pod' },
            { topic: 'microstock best selling category Shutterstock Adobe Stock', category: 'microstock' },
            { topic: 'digital product template best selling Etsy Gumroad', category: 'digital' },
        ];

        const results = [];
        for (const t of topics) {
            try {
                const data = await runDeepResearch(t.topic, t.category, 2); // 2 sources per topik agar cepat
                const tmpl = RESEARCH_TEMPLATES[t.category];
                results.push({
                    category     : t.category,
                    categoryLabel: tmpl.label,
                    categoryEmoji: tmpl.emoji,
                    snippet      : data.rawData.slice(0, 800), // preview
                    sources      : data.sources.slice(0, 3)
                });
            } catch (e) {
                results.push({ category: t.category, error: e.message });
            }
        }

        res.json({
            daily   : results,
            date    : new Date().toISOString(),
            message : 'Daily research selesai. Gunakan /api/research untuk laporan lebih detail.'
        });
    } catch (e) {
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
