// routes/utils/fileExtractors.js
// Centralized file URL extraction utilities

/**
 * Comprehensive image URL extraction from Maytapi messages
 * Checks all known possible locations where Maytapi might store image URLs
 */
const extractImageUrl = (message, originalBody = null) => {
  console.log('[IMAGE_EXTRACT] Starting extraction process');
  
  // All possible locations where Maytapi might store image URLs
  const possibleSources = [
    // Direct message fields
    { source: 'message.url', value: message?.url },
    { source: 'message.media.url', value: message?.media?.url },
    { source: 'message.image.url', value: message?.image?.url },
    { source: 'message.media_url', value: message?.media_url },
    { source: 'message.imageUrl', value: message?.imageUrl },
    { source: 'message.message_url', value: message?.message_url },
    
    // Media object variations
    { source: 'message.media.link', value: message?.media?.link },
    { source: 'message.media.src', value: message?.media?.src },
    { source: 'message.media.source', value: message?.media?.source },
    
    // Document fallback (images sometimes come as documents)
    { source: 'message.document.url', value: message?.document?.url },
    { source: 'message.document.link', value: message?.document?.link },
    
    // Alternative field names
    { source: 'message.file_url', value: message?.file_url },
    { source: 'message.attachment_url', value: message?.attachment_url },
    
    // Original body fallbacks (if provided)
    ...(originalBody ? [
      { source: 'originalBody.url', value: originalBody?.url },
      { source: 'originalBody.media.url', value: originalBody?.media?.url },
      { source: 'originalBody.image.url', value: originalBody?.image?.url },
      { source: 'originalBody.document.url', value: originalBody?.document?.url },
      { source: 'originalBody.message.url', value: originalBody?.message?.url },
      { source: 'originalBody.message.media.url', value: originalBody?.message?.media?.url },
      { source: 'originalBody.message.image.url', value: originalBody?.message?.image?.url },
      { source: 'originalBody.message.document.url', value: originalBody?.message?.document?.url },
      { source: 'originalBody.file_url', value: originalBody?.file_url },
      { source: 'originalBody.attachment_url', value: originalBody?.attachment_url }
    ] : [])
  ];
  
  // Log all possible sources for debugging
  console.log('[IMAGE_EXTRACT] Checking sources:');
  possibleSources.forEach(({ source, value }, index) => {
    if (value !== undefined) {
      console.log(`  [${index}] ${source}: ${value}`);
    }
  });
  
  // Find first valid HTTP(S) URL
  for (const { source, value } of possibleSources) {
    if (value && typeof value === 'string' && isValidUrl(value)) {
      console.log(`[IMAGE_EXTRACT] ✅ Found valid URL from ${source}: ${value}`);
      return value;
    }
  }
  
  console.log('[IMAGE_EXTRACT] ❌ No valid image URL found');
  return null;
};

/**
 * Extract document URL from message
 */
const extractDocumentUrl = (message, originalBody = null) => {
  console.log('[DOC_EXTRACT] Starting document URL extraction');
  
  const possibleSources = [
    { source: 'message.document.url', value: message?.document?.url },
    { source: 'message.url', value: message?.url },
    { source: 'message.file_url', value: message?.file_url },
    { source: 'message.attachment_url', value: message?.attachment_url },
    
    // Original body fallbacks
    ...(originalBody ? [
      { source: 'originalBody.document.url', value: originalBody?.document?.url },
      { source: 'originalBody.url', value: originalBody?.url },
      { source: 'originalBody.message.url', value: originalBody?.message?.url },
      { source: 'originalBody.file_url', value: originalBody?.file_url }
    ] : [])
  ];
  
  for (const { source, value } of possibleSources) {
    if (value && typeof value === 'string' && isValidUrl(value)) {
      console.log(`[DOC_EXTRACT] ✅ Found document URL from ${source}: ${value}`);
      return value;
    }
  }
  
  console.log('[DOC_EXTRACT] ❌ No valid document URL found');
  return null;
};

/**
 * Extract any file URL (images, documents, media)
 */
const extractAnyFileUrl = (message, originalBody = null) => {
  // Try image first, then document
  return extractImageUrl(message, originalBody) || extractDocumentUrl(message, originalBody);
};

/**
 * Get file metadata (type, filename, size, etc.)
 */
const extractFileMetadata = (message, originalBody = null) => {
  const metadata = {
    type: message?.type || 'unknown',
    filename: null,
    mimeType: null,
    caption: null,
    size: null,
    url: null
  };
  
  // Extract filename from various sources
  metadata.filename = message?.filename || 
                     message?.document?.filename || 
                     message?.media?.filename ||
                     originalBody?.filename ||
                     originalBody?.document?.filename;
  
  // Extract MIME type
  metadata.mimeType = message?.mime || 
                     message?.document?.mime || 
                     message?.media?.mime ||
                     originalBody?.mime ||
                     originalBody?.document?.mime;
  
  // Extract caption
  metadata.caption = message?.caption || 
                    message?.document?.caption || 
                    message?.media?.caption ||
                    originalBody?.caption;
  
  // Extract size
  metadata.size = message?.size || 
                 message?.document?.size || 
                 message?.media?.size ||
                 originalBody?.size;
  
  // Extract URL
  metadata.url = extractAnyFileUrl(message, originalBody);
  
  console.log('[FILE_META] Extracted metadata:', metadata);
  return metadata;
};

/**
 * Check if a string is a valid HTTP/HTTPS URL
 */
const isValidUrl = (string) => {
  if (!string || typeof string !== 'string') return false;
  return string.startsWith('http://') || string.startsWith('https://');
};

/**
 * Determine file type based on extension or MIME type
 */
const getFileType = (filename, mimeType) => {
  // Check by extension first
  if (filename) {
    const ext = filename.toLowerCase().split('.').pop();
    
    // Image extensions
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) {
      return 'image';
    }
    
    // Document extensions
    if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(ext)) {
      return 'document';
    }
    
    // Spreadsheet extensions
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return 'spreadsheet';
    }
    
    // Video extensions
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(ext)) {
      return 'video';
    }
    
    // Audio extensions
    if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(ext)) {
      return 'audio';
    }
  }
  
  // Check by MIME type
  if (mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf')) return 'document';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet';
    if (mimeType.startsWith('text/')) return 'document';
  }
  
  return 'unknown';
};

/**
 * Check if file is an image based on various indicators
 */
const isImageFile = (message, originalBody = null) => {
  const metadata = extractFileMetadata(message, originalBody);
  const fileType = getFileType(metadata.filename, metadata.mimeType);
  
  return fileType === 'image' || 
         message?.type === 'image' || 
         message?.type === 'media';
};

/**
 * Check if file is a spreadsheet (Excel/CSV)
 */
const isSpreadsheetFile = (message, originalBody = null) => {
  const metadata = extractFileMetadata(message, originalBody);
  const fileType = getFileType(metadata.filename, metadata.mimeType);
  
  return fileType === 'spreadsheet' ||
         (metadata.filename && /\.(xlsx?|csv)$/i.test(metadata.filename));
};

module.exports = {
  extractImageUrl,
  extractDocumentUrl,
  extractAnyFileUrl,
  extractFileMetadata,
  getFileType,
  isImageFile,
  isSpreadsheetFile,
  isValidUrl
};