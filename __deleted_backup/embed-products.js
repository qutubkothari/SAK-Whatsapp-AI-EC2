// embed-products.js
import 'dotenv/config';
import OpenAI from 'openai';
import fetch from 'node-fetch';

const SUPABASE_URL  = process.env.SUPABASE_URL;
const SUPABASE_KEY  = process.env.SUPABASE_SECRET_API_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const TENANT = process.env.TENANT_ID || '87addc37-dd40-4851-bef0-d57216d6c8ab';

// 1536-dim (matches vector(1536))
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';

if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Missing SUPABASE_URL or server key');
if (!OPENAI_API_KEY) throw new Error('Missing OPENAI_API_KEY');

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function listProductsWithoutEmbeddings(limit = 500) {
  const url = `${SUPABASE_URL}/rest/v1/products?select=id,name,description&tenant_id=eq.${TENANT}&embedding=is.null&limit=${limit}`;
  const r = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
  if (!r.ok) throw new Error(`list products: ${r.status} ${await r.text()}`);
  return r.json();
}

async function patchEmbedding(id, vec) {
  const url = `${SUPABASE_URL}/rest/v1/products?id=eq.${id}`;
  const r = await fetch(url, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify({ embedding: vec })
  });
  if (!r.ok) throw new Error(`update ${id}: ${r.status} ${await r.text()}`);
}

async function run() {
  const items = await listProductsWithoutEmbeddings();
  console.log(`Embedding ${items.length} product(s)…`);
  for (const p of items) {
    const text = [p.name, p.description].filter(Boolean).join(' — ');
    const resp = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: text });
    const vec = resp.data[0].embedding;
    if (vec.length !== 1536) throw new Error(`got ${vec.length} dims; adjust SQL column/function`);
    await patchEmbedding(p.id, vec);
    console.log('OK', p.id, p.name);
  }
  console.log('Done.');
}
run().catch(e => (console.error(e), process.exit(1)));
