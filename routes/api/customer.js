// routes/api/customer.js
// Modular API routes for customer profile and notes management

const express = require('express');
const router = express.Router();
const customerProfileService = require('../../services/customerProfileService');

// GET /api/customers/list/:tenantId - List all customers for a tenant
router.get('/list/:tenantId', async (req, res) => {
  const { tenantId } = req.params;
  // Accept filters from query params
  const { phone, name, minSpent, maxSpent, minOrderDate, maxOrderDate } = req.query;
  try {
    const { customers, error } = await customerProfileService.searchCustomers({ tenantId, phone, name, minSpent, maxSpent, minOrderDate, maxOrderDate });
    if (error) return res.status(500).json({ success: false, error: error.message || error, customers: [] });
    res.json({ success: true, customers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, customers: [] });
  }
});
const customerNotesService = require('../../services/customerNotesService');

// --- Customer Profile Endpoints ---
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await customerProfileService.getCustomerById(id);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/', async (req, res) => {
  const { phone, name, minSpent, maxSpent, minOrderDate, maxOrderDate, tenantId } = req.query;
  const { data, error } = await customerProfileService.searchCustomers({ phone, name, minSpent, maxSpent, minOrderDate, maxOrderDate, tenantId });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', async (req, res) => {
  const { data, error } = await customerProfileService.createCustomer(req.body);
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await customerProfileService.updateCustomer(id, req.body);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await customerProfileService.deleteCustomer(id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

// --- Customer Notes Endpoints ---
router.get('/:id/notes', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await customerNotesService.getNotesByClientId(id);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/:id/notes', async (req, res) => {
  const { id } = req.params;
  const noteData = { ...req.body, client_id: id };
  const { data, error } = await customerNotesService.createNote(noteData);
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/notes/:noteId', async (req, res) => {
  const { noteId } = req.params;
  const { data, error } = await customerNotesService.updateNote(noteId, req.body);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/notes/:noteId', async (req, res) => {
  const { noteId } = req.params;
  const { error } = await customerNotesService.deleteNote(noteId);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

module.exports = router;
