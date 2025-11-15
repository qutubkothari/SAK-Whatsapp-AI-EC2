
// Handles office hours, unsubscribe, menu, etc.

async function handleUnsubscribeCheck(userQuery, from, tenant, sendAndLogMessage, res) {
	// ...migrated logic from customerHandler.js...
}

async function handleOfficeHoursCheck(userQuery, from, tenant, sendAndLogMessage, res) {
	// ...migrated logic from customerHandler.js...
}

async function handleMenuCheck(userQuery, from, tenant, sendAndLogMessage, res) {
	// ...migrated logic from customerHandler.js...
}

async function handleAdminLoginCheck(userQuery, from, tenant, sendAndLogMessage, handleLoginCommand, res) {
	// ...migrated logic from customerHandler.js...
}

async function handleEarlyZohoHandlers(userQuery, tenant, from, conversation, handleInvoiceRequest, handleOrderApproval, sendAndLogMessage, res) {
	// Invoice command handling (robust: "send invoice", "give invoice", "get invoice", "invoice", "bill", etc.)
	if (/\b(send|give|get|show|provide)?\s*(me|us|the)?\s*(invoice|bill)\b/i.test(userQuery)) {
		console.log('[INVOICE_COMMAND] Matched invoice command:', userQuery);
		try {
			const result = await handleInvoiceRequest(tenant, from, conversation, userQuery);
			console.log('[INVOICE_COMMAND] Invoice handler result:', result);
			if (result && result.success) {
				res.status(200).json({ ok: true, type: 'invoice_request', result });
			} else {
				await sendAndLogMessage(from, 'Sorry, there was a problem generating your invoice. Please try again.', tenant.id, 'invoice_error');
				res.status(200).json({ ok: false, type: 'invoice_error', result });
			}
		} catch (err) {
			console.error('[INVOICE_COMMAND] Error in invoice handler:', err);
			await sendAndLogMessage(from, `❌ Invoice error: ${err.message || err}`, tenant.id, 'invoice_error');
			res.status(200).json({ ok: false, type: 'invoice_error', error: err.message || err });
		}
		return true;
	}
	// Add other early Zoho handlers here as needed
	return false;
}

module.exports = {
	handleUnsubscribeCheck,
	handleOfficeHoursCheck,
	handleMenuCheck,
	handleAdminLoginCheck,
	handleEarlyZohoHandlers
};
