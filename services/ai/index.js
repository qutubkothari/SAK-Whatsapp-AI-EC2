/**
 * AI Services Module
 * 
 * Provides intelligent context building, response generation,
 * intent classification, and memory management for customer conversations.
 * 
 * Usage:
 *   const { contextBuilder, responseGenerator, intentClassifier, memoryManager } = require('./services/ai');
 */

module.exports = {
  // Context Builder - Gathers customer intelligence and patterns
  contextBuilder: require('./contextBuilder'),
  
  // Response Generator - Creates intelligent AI responses with context
  responseGenerator: require('./responseGenerator'),
  
  // Intent Classifier - Classifies customer intent and routes intelligently
  intentClassifier: require('./intentClassifier'),
  
  // Memory Manager - Stores and retrieves conversation memories
  memoryManager: require('./memoryManager')
};