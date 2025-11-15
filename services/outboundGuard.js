// services/outboundGuard.js
// APPEND-ONLY, SAFE WRAPPER. No changes to callers; just require this once at startup.

let may = null;
try { may = require('./maytapiService'); } catch { /* not fatal */ }

// normalize to digits (MSISDN)
const msisdn = x => String(x || '').replace(/\D/g, '');

// normalize all the text payload variants your code uses -> { text }
function unwrapText(payloadOrText) {
  if (typeof payloadOrText === 'string') return payloadOrText;
  if (!payloadOrText || typeof payloadOrText !== 'object') return '';
  if (typeof payloadOrText.text === 'string') return payloadOrText.text;
  if (payloadOrText.text && typeof payloadOrText.text.body === 'string') return payloadOrText.text.body;
  if (typeof payloadOrText.message === 'string') return payloadOrText.message;
  if (payloadOrText.message && typeof payloadOrText.message.text === 'string') return payloadOrText.message.text;
  if (typeof payloadOrText.body === 'string') return payloadOrText.body;
  return '';
}

async function sendViaMaytapi(to, payloadOrText) {
  const toNum = msisdn(to);
  const text = unwrapText(payloadOrText);
  if (!toNum || !text) {
    console.warn('[OUTBOUND] skipped: invalid to/text', { to, textLength: text.length });
    return { ok:false, skipped:true };
  }
  if (!may || typeof may.sendMessage !== 'function') {
    console.warn('[OUTBOUND] maytapiService missing; cannot send');
    return { ok:false, skipped:true };
  }
  try {
    const res = await may.sendMessage(toNum, text);
    const status = res?.status ?? res?.statusCode ?? 'ok';
    console.log('[OUTBOUND RES]', status, String(res?.data ? JSON.stringify(res.data) : '').slice(0, 300));
    return res;
  } catch (e) {
    const status = e?.response?.status;
    const data = e?.response?.data || e?.message;
    console.error('[OUTBOUND ERR]', status, typeof data === 'string' ? data.slice(0,300) : JSON.stringify(data || '').slice(0,300));
    throw e;
  }
}

function patchGlobalSenders() {
  // 1) Global sendWhatsAppText(to, text)
  try {
    if (typeof global.sendWhatsAppText === 'function' && !global.sendWhatsAppText.__outboundGuard) {
      const __orig = global.sendWhatsAppText;
      global.sendWhatsAppText = async (to, text) => {
        try { return await sendViaMaytapi(to, text); }
        catch { return __orig(msisdn(to), text); }
      };
      global.sendWhatsAppText.__outboundGuard = true;
    }
  } catch {}

  // 2) Global sendMessage( obj | to, payload )
  try {
    if (typeof global.sendMessage === 'function' && !global.sendMessage.__outboundGuard) {
      const __orig = global.sendMessage;
      global.sendMessage = async (a, b) => {
        if (a && typeof a === 'object' && !b) {
          const to = a.to || a.to_number || a.toNumber || a.recipient;
          const payload = a.text ?? a.message ?? a;
          try { return await sendViaMaytapi(to, payload); }
          catch { return __orig(a); }
        } else {
          try { return await sendViaMaytapi(a, b); }
          catch { return __orig(msisdn(a), b); }
        }
      };
      global.sendMessage.__outboundGuard = true;
    }
  } catch {}

  // 3) Service object forms (whatsappService.sendText / sendMessage)
  try {
    if (typeof global.whatsappService !== 'undefined' && global.whatsappService && !global.whatsappService.__outboundGuard) {
      const svc = global.whatsappService;

      if (typeof svc.sendText === 'function') {
        const __orig = svc.sendText.bind(svc);
        svc.sendText = async (to, text) => {
          try { return await sendViaMaytapi(to, text); }
          catch { return __orig(msisdn(to), text); }
        };
      }
      if (typeof svc.sendMessage === 'function') {
        const __orig = svc.sendMessage.bind(svc);
        svc.sendMessage = async (a, b) => {
          if (a && typeof a === 'object' && !b) {
            const to = a.to || a.to_number || a.toNumber || a.recipient;
            const payload = a.text ?? a.message ?? a;
            try { return await sendViaMaytapi(to, payload); }
            catch { return __orig(a); }
          } else {
            try { return await sendViaMaytapi(a, b); }
            catch { return __orig(msisdn(a), b); }
          }
        };
      }

      svc.__outboundGuard = true;
    }
  } catch {}
}

module.exports.initOutbound = function initOutbound() {
  // only once
  if (global.__outboundGuardInit) return;
  global.__outboundGuardInit = true;
  patchGlobalSenders();
  console.log('[OUTBOUND] guard initialized');
};
