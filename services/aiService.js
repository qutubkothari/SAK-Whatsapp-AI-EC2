/**
 * @title AI Service
 * @description This service handles interactions with the AI model (OpenAI/Gemini)
 * and the database to provide intelligent, context-aware responses.
 */
const { openai, supabase } = require('./config');

/**
 * Creates a vector embedding for a given text using OpenAI's API.
 * @param {string} text The text to create an embedding for.
 * @returns {Promise<number[]>} A promise that resolves to the vector embedding.
 */
const createEmbedding = async (text) => {
    try {
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: String(text || '').slice(0, 8000), // guard length
        });
        return response.data[0].embedding;
    } catch (error) {
        console.error('Error creating embedding:', error);
        throw error;
    }
};

/**
 * Matches a user's query to the most relevant products in the database using vector search.
 * @param {string} tenantId The ID of the tenant whose products to search.
 * @param {number[]} queryEmbedding The vector embedding of the user's query.
 * @returns {Promise<string>} A promise that resolves to the formatted product context.
 */
const getContextFromDB = async (tenantId, queryEmbedding) => {
    try {
        const { data, error } = await supabase.rpc('match_products', {
            tenant_id_param: tenantId,
            query_embedding: queryEmbedding,
            match_threshold: 0.78,
            match_count: 3
        });

        if (error) throw error;

        if (!data || data.length === 0) {
            return "No relevant product information found.";
        }

        return data.map(product =>
            `Product Name: ${product.name}\nDescription: ${product.description}\nPrice: ${product.price}`
        ).join('\n\n');

    } catch (error) {
        console.error('Error retrieving context from database:', error.message);
        return "There was an error retrieving product information.";
    }
};

/**
 * Generates an AI response based on the user's query and the retrieved context.
 * @param {string} tenantId The ID of the tenant.
 * @param {string} userQuery The user's question.
 * @returns {Promise<string>} A promise that resolves to the AI-generated answer.
 */
const getAIResponse = async (tenantId, userQuery) => {
    try {
        // 1. Fetch the tenant's custom settings and business profile
        const { data: tenant, error: tenantError } = await supabase
            .from('tenants')
            .select('bot_personality, bot_language, business_name, business_address, business_website')
            .eq('id', tenantId)
            .single();

        if (tenantError) throw tenantError;

        // 2. Create an embedding for the user's query
        const queryEmbedding = await createEmbedding(userQuery);

        // 3. Get relevant product context from the database
        const productContext = await getContextFromDB(tenantId, queryEmbedding);

        // 4. Create the business profile context
        let businessProfileContext = "--- BUSINESS PROFILE ---\n";
        if (tenant.business_name) businessProfileContext += `Name: ${tenant.business_name}\n`;
        if (tenant.business_address) businessProfileContext += `Address: ${tenant.business_address}\n`;
        if (tenant.business_website) businessProfileContext += `Website: ${tenant.business_website}\n`;
        businessProfileContext += "--- END BUSINESS PROFILE ---";

        // 5. Construct the system prompt with all available context
        const defaultPersonality = 'You are a friendly and professional WhatsApp sales assistant.';
        const botPersonality = tenant.bot_personality || defaultPersonality;
        const botLanguage = tenant.bot_language || 'English';

        const systemPrompt = `${botPersonality}
You are a helpful sales assistant. Use the context provided below to answer questions about products and services.
You MUST respond in ${botLanguage}.
- For Arabic: Use Modern Standard Arabic (العربية) that is widely understood
- For Urdu: Use professional Urdu (اردو)
- For Hinglish: Mix Hindi and English naturally as spoken in India
- For other languages: Maintain professional yet friendly tone
When customers ask about products, check if you have similar or related items in your product catalog.
Be helpful and suggest alternatives if exact matches aren't available.
Only say you don't have information if the query is completely unrelated to your business.`;

        // 6. Call the AI model to get the response
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{
                role: "system",
                content: systemPrompt
            }, {
                role: "user",
                content: `
${businessProfileContext}

--- PRODUCT INFORMATION ---
${productContext}
--- END PRODUCT INFORMATION ---

User's Question: "${userQuery}"

Your Answer (in ${botLanguage}):
`
            }],
            temperature: 0.2,
        });

        return response.choices[0].message.content;

    } catch (error) {
        console.error('Error in getAIResponse:', error.message);
        return "I'm sorry, but I encountered an error while trying to process your request. Please try again later.";
    }
};

// =========================
// ADDITIVE ENHANCEMENTS
// =========================

// 1) Runtime-configurable model names (env > sensible defaults)
const AI_FAST_MODEL   = process.env.AI_MODEL_FAST   || 'gpt-4o-mini';
const AI_SMART_MODEL  = process.env.AI_MODEL_SMART  || 'gpt-3.5-turbo-16k';
const AI_EMBED_MODEL  = process.env.AI_EMBEDDING_MODEL || 'text-embedding-3-small';

// Canonical embedding model name used everywhere below
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || AI_EMBED_MODEL || 'text-embedding-3-small';

// 2) Small debug helper (prints only when DEBUG_AI=1)
const _dbgAI = (...a) => { if (process.env.DEBUG_AI === '1') console.log('[AI]', ...a); };


// 3) Safe embedding creator (keeps your original createEmbedding untouched)
async function createEmbeddingSafe(text) {
  try {
    _dbgAI('embed:model', EMBEDDING_MODEL);
    const r = await openai.embeddings.create({ 
      model: EMBEDDING_MODEL, 
      input: String(text || '').slice(0, 8000) // guard length
    });
    return r.data[0].embedding;
  } catch (e) {
    // Fallback to ada-002 if a newer model is not available
    if (EMBEDDING_MODEL !== 'text-embedding-ada-002') {
      try {
        console.warn('[AI][embed] primary model failed, falling back to text-embedding-ada-002:', e?.message || e);
        const r2 = await openai.embeddings.create({ 
          model: 'text-embedding-ada-002', 
          input: String(text || '').slice(0, 8000) // guard length
        });
        return r2.data[0].embedding;
      } catch (e2) {
        console.error('[AI][embed] fallback failed:', e2?.message || e2);
        throw e2;
      }
    }
    throw e;
  }
}

// 4) Generic chat wrapper (env-driven model + compact params)
async function chatComplete({ system, user, mode = 'fast', temperature = 0.2 }) {
  const model = mode === 'smart' ? AI_SMART_MODEL : AI_FAST_MODEL;
  _dbgAI('chat:model', model, 'mode:', mode);
  const resp = await openai.chat.completions.create({
    model,
    temperature,
    messages: [
      ...(system ? [{ role: 'system', content: system }] : []),
      { role: 'user', content: user }
    ]
  });
  return (resp.choices?.[0]?.message?.content || '').trim();
}

// 5) V2 response path (non-breaking, uses your existing DB helpers)
async function getAIResponseV2(tenantId, userQuery, opts = {}) {
  try {
    // (a) Load tenant business/profile fields just like your V1 path
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('bot_personality, bot_language, business_name, business_address, business_website')
      .eq('id', tenantId)
      .single();

    if (tenantError) throw tenantError;

    // (b) Embedding with safe fallback
    let queryEmbedding;
    try {
      queryEmbedding = await createEmbeddingSafe(userQuery);
    } catch (e) {
      console.error('[AI][V2] embedding failed:', e?.message || e);
      // Fall back to your original createEmbedding so this remains non-breaking
      queryEmbedding = await createEmbedding(userQuery);
    }

    // (c) Product context via your existing function
    const productContext = await getContextFromDB(tenantId, queryEmbedding);

    // (d) Business profile block (re-using your structure)
    let businessProfileContext = "--- BUSINESS PROFILE ---\n";
    if (tenant.business_name)    businessProfileContext += `Name: ${tenant.business_name}\n`;
    if (tenant.business_address) businessProfileContext += `Address: ${tenant.business_address}\n`;
    if (tenant.business_website) businessProfileContext += `Website: ${tenant.business_website}\n`;
    businessProfileContext += "--- END BUSINESS PROFILE ---";

    // Add conversation context
    let conversationContext = '';
    try {
      const { data: recentMessages } = await supabase
        .from('messages')
        .select(`
          sender,
          message_body,
          conversation:conversations!inner (
            tenant_id
          )
        `)
        .eq('conversation.tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentMessages && recentMessages.length > 0) {
        conversationContext = '\n--- RECENT CONVERSATION ---\n' + 
          recentMessages.reverse().map(msg => 
            `${msg.sender === 'user' ? 'Customer' : 'Assistant'}: ${msg.message_body}`
          ).join('\n') + '\n--- END CONVERSATION ---\n';
      }
    } catch (error) {
      console.warn('[AI] Could not fetch conversation context:', error.message);
    }

    // (e) System prompt (respects tenant personality/lang, defaults preserved)
    const defaultPersonality = 'You are a friendly and professional WhatsApp sales assistant.';
    const botPersonality = tenant.bot_personality || defaultPersonality;
    const botLanguage    = tenant.bot_language    || 'English';

    const systemPrompt = `${botPersonality}
Your goal is to answer the user's question based ONLY on the context provided below (Business Profile and Product Information).
You MUST respond in ${botLanguage}.
When customers ask about products, help them find what they need from the available products. Be conversational and helpful.
Do not make up details. Keep your answers concise and clear.`;

    // (f) Chat call using env-driven models with graceful failure handling
    try {
      const answer = await chatComplete({
        system: systemPrompt,
        user: `
${businessProfileContext}

--- PRODUCT INFORMATION ---
${productContext}
--- END PRODUCT INFORMATION ---
${conversationContext}
User's Question: "${userQuery}"

Your Answer (in ${botLanguage}):
`,
        mode: opts.mode || 'fast',
        temperature: typeof opts.temperature === 'number' ? opts.temperature : 0.2
      });
      return answer || `Sorry, I couldn't generate a response right now.`;
    } catch (err) {
      // Never 500 your webhook because of AI hiccups
      console.error('[AI][V2] chat failed:', err?.response?.data || err?.message || err);
      return "I'm sorry, I couldn't generate an answer at this moment.";
    }

  } catch (error) {
    console.error('Error in getAIResponseV2:', error?.message || error);
    return "I'm sorry, but I encountered an error while trying to process your request. Please try again later.";
  }
}

/**
 * Analyze image using OpenAI Vision API
 * @param {string} imageUrl - URL of the image to analyze
 * @param {string} prompt - Analysis prompt
 * @returns {Promise<{text: string}>} - Analysis result
 */
const analyzeImage = async (imageUrl, prompt) => {
  try {
    console.log('[AI] Analyzing image:', imageUrl);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.1
    });

    const text = response.choices[0]?.message?.content || '';
    console.log('[AI] Image analysis result:', text);

    return { text };
  } catch (error) {
    console.error('[AI] Image analysis failed:', error.message);
    return { text: '' };
  }
};

// 6) Export the new helpers WITHOUT removing existing exports
module.exports.createEmbeddingSafe = createEmbeddingSafe;
module.exports.chatComplete        = chatComplete;
module.exports.getAIResponseV2     = getAIResponseV2;
module.exports.analyzeImage        = analyzeImage;

// Merge exports to include V2 helpers alongside originals
module.exports = {
  getAIResponse,
  createEmbedding,
  createEmbeddingSafe,
  chatComplete,
  getAIResponseV2,
  analyzeImage
};

// Optional: env toggle to prefer V2 automatically (no deletions)
if (process.env.AI_PATH === 'v2' && typeof module.exports.getAIResponseV2 === 'function') {
  module.exports.getAIResponse = module.exports.getAIResponseV2;
  console.log('[AI] Using V2 getAIResponse via AI_PATH=v2');
}
console.log('[AI] AI_PATH =', process.env.AI_PATH || '(default)');

// ---- ADD: prefer the project-aware client if present ----
try {
  const cfg = require('./config');
  if (cfg.openaiV2 && module.exports.openai !== cfg.openaiV2) {
    module.exports.openai = cfg.openaiV2;
    console.log('[AI] Using project-aware OpenAI client from config');
  }
} catch (e) {
  console.error('[AI] Could not switch to project-aware client:', e?.message || e);
}

// ---- ADD: single-point debug wrapper for chat completions ----
try {
  const openai = module.exports.openai || require('./config').openaiV2 || require('./config').openai;
  if (openai?.chat?.completions?.create && !openai._debugWrapped) {
    const _orig = openai.chat.completions.create.bind(openai.chat.completions);
    openai.chat.completions.create = async (params) => {
      const rid = (Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7)).toUpperCase();
      console.log(`[AI][${rid}] chat.request`, { model: params?.model, temp: params?.temperature });
      try {
        const r = await _orig(params);
        console.log(`[AI][${rid}] chat.ok`, { usage: r?.usage });
        return r;
      } catch (e) {
        // Use the local function defined below instead of circular require
        traceAIError('chat', e);
        throw e;
      }
    };
    openai._debugWrapped = true;
    module.exports.openai = openai; // keep export pointing to wrapped client
  }
} catch (e) {
  console.error('[AI] debug wrap failed', e?.message || e);
}

// --- ADD: better error tracer for AI calls
function traceAIError(tag, err) {
  const status = err?.status || err?.code || null;
  const data = err?.response?.data || err?.message || String(err);
  console.error(`[AI][${tag}] status=${status}`, data);
  return { status, data };
}
module.exports.traceAIError = traceAIError;

// ---- ADD: analysis shim (never throws, keeps webhook flowing)
let __analysisMod = null;
function __getAnalysisMod() {
  if (__analysisMod) return __analysisMod;
  try {
    // Try likely modules without failing the app
    __analysisMod = require('./conversationService');
  } catch {}
  if (!__analysisMod) {
    try { __analysisMod = require('./analyticsService'); } catch {}
  }
  return __analysisMod || {};
}

// Define a global so legacy/direct calls succeed without edits elsewhere
global.analyzeAndTagConversation = global.analyzeAndTagConversation || (async (...args) => {
  try {
    const m = __getAnalysisMod();
    const fn = m?.analyzeAndTagConversation || m?.default?.analyzeAndTagConversation;
    if (typeof fn === 'function') return await fn(...args);
  } catch (e) {
    console.error('[ANALYZE] shim error:', e?.message || e);
  }
  // Fallback: return a benign categorization so downstream code continues
  return { category: 'General', followup_at: null, lead_score: null };
});

// --- ADD (safe singleton guard) ---
if (!global.__AI_HELPERS_SINGLETON__) {
  global.extractTextFromOpenAI = function extractTextFromOpenAI(result) {
    try {
      // Chat Completions
      if (result?.choices?.[0]?.message?.content) {
        return result.choices[0].message.content;
      }
      // Responses API
      const out = result?.output || result?.content || result?.message || null;
      if (Array.isArray(out)) {
        const text = out
          .map(p =>
            (p?.text?.value) ||
            (Array.isArray(p?.content) && p.content[0]?.text?.value) ||
            ''
          )
          .filter(Boolean)
          .join('\n')
          .trim();
        if (text) return text;
      }
      if (typeof result?.text === 'string') return result.text;
    } catch {}
    return null;
  };

  global.logAIError = function logAIError(tag, err) {
    const status = err?.status || err?.code || null;
    const data = err?.response?.data || err?.message || String(err);
    console.error(`[AI][${tag}] status=${status} error=`, data);
    return { status, data };
  };

  // mark as initialized so the block never runs twice
  global.__AI_HELPERS_SINGLETON__ = true;
}

// Export references (no re-declare)
module.exports.extractTextFromOpenAI = global.extractTextFromOpenAI;
module.exports.logAIError = global.logAIError;

// --- BEGIN: singleton wrapper to avoid re-declare conflicts ---
global.__AI_SINGLETONS__ = global.__AI_SINGLETONS__ || {};
const OpenAI = require('openai');

// Try to get helpers without creating circular require issues
let __helpers = {};
try { __helpers = require('./services/aiService'); } catch {}
const extractTextFromOpenAI =
  __helpers.extractTextFromOpenAI || global.extractTextFromOpenAI;
const logAIError =
  __helpers.logAIError || global.logAIError;

if (!global.__AI_SINGLETONS__.getAIResponseV3) {
  global.__AI_SINGLETONS__.getAIResponseV3 = async function getAIResponseV3({ system, user, mode = 'fast' } = {}) {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      project: process.env.OPENAI_PROJECT || undefined,
    });

    const model = mode === 'smart'
      ? (process.env.AI_MODEL_SMART || 'gpt-4o')
      : (process.env.AI_MODEL_FAST  || 'gpt-4o-mini');

    try {
      const res = await client.chat.completions.create({
        model,
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          { role: 'user', content: user || '' },
        ],
        temperature: 0.2,
      });

      const text = extractTextFromOpenAI(res);
      if (!text) {
        console.error('[AI] Empty content from OpenAI (chat)', {
          id: res?.id, usage: res?.usage, choices: res?.choices?.length
        });
        return 'Sorry — I could not generate a response right now.';
      }
      return text;
    } catch (e) {
      logAIError('chat', e);
      return 'Sorry — I hit an AI error. Please try again.';
    }
  }; // end getAIResponseV3
}
// Always export the singleton (no re-declare)
module.exports.getAIResponseDirect = global.__AI_SINGLETONS__.getAIResponseV3;
// keep the legacy export name if not already set
module.exports.getAIResponse = module.exports.getAIResponse || global.__AI_SINGLETONS__.getAIResponseV3;
// --- END: singleton wrapper ---

