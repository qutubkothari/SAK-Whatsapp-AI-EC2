// services/customerNotesService.js
// Modular service for customer notes CRUD

const { supabase } = require('./config');

module.exports = {
  // Get notes for a customer
  async getNotesByClientId(clientId) {
    return supabase.from('customer_notes').select('*').eq('client_id', clientId).order('created_at', { ascending: false });
  },

  // Create a note
  async createNote(data) {
    return supabase.from('customer_notes').insert([data]).single();
  },

  // Update a note
  async updateNote(id, data) {
    return supabase.from('customer_notes').update(data).eq('id', id).single();
  },

  // Delete a note
  async deleteNote(id) {
    return supabase.from('customer_notes').delete().eq('id', id);
  }
};
