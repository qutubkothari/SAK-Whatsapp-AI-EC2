const axios = require('axios');

async function sendTextViaProvider({ to, text, providerConfig }) {
  // build the provider payload (adapt field names)
  const payload = {
    to,
    type: 'text',
    text: { body: text }
    // provider-specific fields...
  };

  console.log('[OUTBOUND] Preparing to send', { to, text: (text||'').slice(0,200) });

  try {
    const start = Date.now();
    const resp = await axios({
      method: 'post',
      url: providerConfig.url,       // e.g. 'https://api.maytapi.com/api/XXXX/messages'
      headers: {
        Authorization: `Bearer ${providerConfig.token}`,
        'Content-Type': 'application/json'
      },
      data: payload,
      timeout: 15000
    });

    const duration = Date.now() - start;
    console.log('[OUTBOUND] provider request completed', {
      to,
      status: resp.status,
      duration_ms: duration,
      providerResponseSnippet: JSON.stringify(resp.data).slice(0,1000)
    });

    // Persist provider response in DB if you have a save function
    // await saveMessageOutboundLog({ to, text, providerResponse: resp.data, statusCode: resp.status });

    return { ok: true, status: resp.status, data: resp.data };
  } catch (err) {
    console.error('[OUTBOUND][ERROR] send failed', {
      to,
      message: err.message,
      code: err.code,
      responseStatus: err.response && err.response.status,
      responseDataSnippet: err.response ? JSON.stringify(err.response.data).slice(0,1000) : null,
    });
    // Save the error to DB for later inspection if desired
    // await saveMessageOutboundLog({ to, text, providerResponse: err.response?.data, statusCode: err.response?.status, error: err.message });

    return { ok: false, error: err.message, response: err.response?.data, status: err.response?.status };
  }
}

module.exports = { sendTextViaProvider };
