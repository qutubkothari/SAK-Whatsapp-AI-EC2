/**
 * @title Service Configuration
 * @description Initializes and exports clients for external services like Supabase, OpenAI, and Google Cloud Storage.
 * Compatible with local .env and GAE env vars. Additive, backward-compatible.
 */

require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const { Storage } = require('@google-cloud/storage');

const dbg = (...a) => { if (process.env.DEBUG_CONFIG === '1') console.log('[CONFIG]', ...a); };

// ---------- Supabase ----------
const supabaseUrl =
  process.env.SUPABASE_URL;

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || // prefer service role key on server
  process.env.SUPABASE_ANON_KEY;      // fallback if that's what you configured

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and Key must be provided in environment variables.');
}
dbg('Supabase: using', supabaseKey === process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE_KEY' : 'ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

// ---------- OpenAI ----------
const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
  throw new Error('OpenAI API Key must be provided in environment variables.');
}

// If you use sk-proj-* keys, pass the project id/slug
const openaiProject =
  process.env.OPENAI_PROJECT || undefined;

const openai = new OpenAI({
  apiKey: openaiApiKey,
  ...(openaiProject ? { project: openaiProject } : {})
});
dbg('OpenAI: project', openaiProject ? 'set' : 'not set');

// ---------- Google Cloud Storage ----------
const storage = new Storage();

// Accept multiple bucket env names to avoid boot failures
const gcsBucketName =
  process.env.GCS_BUCKET_NAME ||
  process.env.GCS_BUCKET ||
  process.env.GOOGLE_CLOUD_STORAGE_BUCKET;

if (!gcsBucketName) {
  throw new Error('Google Cloud Storage bucket name must be provided in environment variables.');
}
const bucket = storage.bucket(gcsBucketName);
dbg('GCS bucket:', gcsBucketName);

module.exports = {
  supabase,
  openai,
  bucket,
};

// ---- ADD: project-aware OpenAI client (keeps existing exports) ----
try {
  const _apiKey = process.env.OPENAI_API_KEY;
  const _proj   = process.env.OPENAI_PROJECT; // e.g. proj_HXrnhKI5YuehJumAke2sXqiN
  if (_apiKey && _proj) {
    const OpenAI = require('openai');
    const _openaiWithProject = new OpenAI({ apiKey: _apiKey, project: _proj });
    module.exports.openaiV2 = _openaiWithProject;
    console.log('[CONFIG] OpenAI (project client) enabled');
  }
} catch (e) {
  console.error('[CONFIG] OpenAI project client init failed:', e?.message || e);
}

// ADDITIVE: config boot diagnostics (masked)
try {
  const dbg = require('./debug');
  if (process.env.DEBUG_CONFIG === '1') {
    console.log('[CONFIG] OpenAI project set:', !!process.env.OPENAI_PROJECT);
    console.log('[CONFIG] OpenAI key mask:', dbg.mask(process.env.OPENAI_API_KEY || ''));
    console.log('[CONFIG] Models fast/smart:', process.env.AI_MODEL_FAST, process.env.AI_MODEL_SMART);
  }
} catch (e) {}
