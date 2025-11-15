const buckets = new Map();


module.exports = function rateLimit({ windowMs = 10_000, max = 20 } = {}) {
return (req, res, next) => {
const key = req.message?.from || req.ip || 'anon';
const now = Date.now();
const b = buckets.get(key) || { count: 0, ts: now };
if (now - b.ts > windowMs) { b.count = 0; b.ts = now; }
b.count += 1; buckets.set(key, b);
if (b.count > max) return res.status(200).json({ ok:false, error:'rate-limited' });
next();
};
};