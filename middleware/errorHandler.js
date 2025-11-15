module.exports = (err, _req, res, _next) => {
console.error('[WEBHOOK_ERR]', err && (err.stack || err.message || err));
return res.status(200).json({ ok:false, error:'internal' });
};