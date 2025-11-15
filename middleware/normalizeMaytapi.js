module.exports = (req, _res, next) => {
  const b = req.body || {};
  let out = b;
  if (b.message && !b.from && !b.to) {
    const m = b.message || {};
    const raw = typeof m.text === 'string'
      ? m.text
      : (m.text && typeof m.text.body === 'string' ? m.text.body : '');
    out = {
      from: m.from || b.user?.id || b.conversation || b.from || null,
      to:   m.to   || b.receiver  || b.to           || null,
      type: m.type || (raw ? 'text' : m.type),
      text: raw ? { body: raw } : (m.text || b.text || null),
      product_id: b.product_id, phone_id: b.phone_id, reply: b.reply, timestamp: b.timestamp
    };
  }
  if (out?.type === 'text' && out.text && typeof out.text.body !== 'string') {
    out.text = { body: String(out.text.body || '') };
  }
  if (!out.from || !out.to) return next({ status:200, body:{ ok:false, error:'invalid-format' }});
  req.body = out;
  req.message = out;
  next();
};
