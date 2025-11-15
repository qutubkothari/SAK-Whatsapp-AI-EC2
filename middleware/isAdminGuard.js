module.exports = (req, _res, next) => {
  const { from } = req.message || {};
  const t = req.tenant || {};
  req.isAdmin = (from === t.owner_whatsapp_number) ||
                (Array.isArray(t.admin_phones) && t.admin_phones.includes(from));
  next();
};
