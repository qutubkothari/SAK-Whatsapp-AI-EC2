# Feature Testing Guide
## Three Key Features Analysis & Testing

This document provides a comprehensive guide for testing and fixing three critical features of the SAK WhatsApp AI Sales Assistant.

---

## Feature 1: Broadcast System with Excel Upload

### Current Implementation Status: ✅ IMPLEMENTED

**Location:**
- [services/broadcastService.js](services/broadcastService.js)
- [commands/broadcast.js](commands/broadcast.js)

### Configuration (Currently Hardcoded):
```javascript
// In services/broadcastService.js lines 11-15
const BATCH_SIZE = 5;                         // 5 messages per batch
const MESSAGE_DELAY = 12000;                  // 12 seconds between messages
const BATCH_COOLDOWN = 1 * 60 * 1000;        // 1 minute between batches
const MAX_RETRIES = 3;
const LOCK_TIMEOUT = 1 * 60 * 1000;          // 1 minute lock timeout
```

### How It Works:

#### Step 1: Schedule Broadcast (Text)
```
/broadcast "Campaign Name" "tomorrow 10am" "Your message text"
```
or for immediate broadcast:
```
/broadcast_now "Campaign Name" "Your message text"
```

#### Step 2: Upload Excel File
- Excel format: Column A = Phone numbers, Column B = Names (optional)
- System automatically extracts contacts and validates phone numbers
- Adds +91 country code for 10-digit Indian numbers

#### Step 3: Automatic Processing
- Messages queued in `bulk_schedules` table
- Cron job processes queue every minute
- Rate limiting: 5 messages per batch, 1-minute cooldown between batches
- Unsubscribed users automatically skipped

### Image Broadcast:

#### Step 1: Schedule
```
/broadcast_image "Campaign Name" "tomorrow 10am" "Your message text"
```
or immediate:
```
/broadcast_image_now "Campaign Name" "Your message text"
```

#### Step 2: Upload Image
- Send the image file

#### Step 3: Upload Excel
- Send the contacts Excel file

### Testing Checklist:

- [ ] **Test 1:** Schedule future text broadcast
  - Send `/broadcast "Test Campaign" "in 5 minutes" "Hello from SAK!"`
  - Upload Excel file with test phone numbers
  - Verify campaign appears in `bulk_schedules` table
  - Wait 5 minutes and check if messages were sent

- [ ] **Test 2:** Immediate text broadcast
  - Send `/broadcast_now "Quick Test" "Immediate message"`
  - Upload Excel file
  - Messages should start sending within 1 minute

- [ ] **Test 3:** Image broadcast
  - Send `/broadcast_image_now "Image Test" "Check out our products"`
  - Upload an image
  - Upload Excel file
  - Verify image is sent with message

- [ ] **Test 4:** Batch rate limiting
  - Upload Excel with 20 phone numbers
  - Monitor logs: should see batches of 5 messages
  - Verify 1-minute cooldown between batches

- [ ] **Test 5:** Excel parsing
  - Test with various formats (with/without country codes)
  - Test with names in column B
  - Test with invalid numbers (should be skipped)

### Known Issues & Fixes Needed:

❌ **Issue 1: Hardcoded batch settings**
- **Problem:** BATCH_SIZE and delays are hardcoded
- **Fix Needed:** Make configurable per tenant in database or admin panel
- **File:** [services/broadcastService.js:11-15](services/broadcastService.js#L11-L15)

❌ **Issue 2: No admin UI for monitoring**
- **Problem:** No way to see broadcast status without checking database
- **Fix Needed:** Create admin endpoint to view queue status
- **Suggested Location:** `routes/api/broadcastStatus.js`

✅ **Working:** Excel parsing, rate limiting, unsubscribe handling, error retry logic

---

## Feature 2: AI Image Recognition for Products

### Current Implementation Status: ✅ IMPLEMENTED

**Location:**
- [routes/handlers/imageHandler.js](routes/handlers/imageHandler.js) (lines 178-270)
- [services/ocrService.js](services/ocrService.js)

### How It Works:

1. **Customer uploads product image**
2. **System extracts image URL** from Maytapi webhook
3. **AI analyzes image** using OpenAI Vision API (GPT-4 Vision)
4. **OCR extracts text** if product code is visible
5. **Product matching** against database using code or description
6. **Response sent** with product name, price, and availability

### Testing Checklist:

- [ ] **Test 1:** Upload clear product image with visible text
  - Take photo of a product with visible product code (e.g., "NFF 8x80")
  - Send to WhatsApp bot as customer
  - Verify bot identifies product and returns:
    - Product name
    - Product code
    - Price per carton
    - Availability status

- [ ] **Test 2:** Upload image without text (visual only)
  - Send image of product without visible codes
  - Verify bot attempts visual recognition
  - Should return "Could not identify" if no match

- [ ] **Test 3:** Product context tracking
  - After image recognition, send follow-up: "What is the price?"
  - Bot should remember the last identified product
  - Verify conversation context is saved in `conversations.last_product_discussed`

- [ ] **Test 4:** Multiple images in sequence
  - Upload 3 different product images
  - Verify each is processed independently
  - Verify last one is saved to context

### Code Flow:
```
Customer sends image
  ↓
routes/webhook.js detects message.type === 'image'
  ↓
routes/handlers/imageHandler.js → handleCustomerImageUpload()
  ↓
services/ocrService.js → identifyProductFromImage()
  ↓
OpenAI Vision API analyzes image
  ↓
Extract product code from OCR text
  ↓
Query products table for match
  ↓
Return price & details
  ↓
Save to conversations.last_product_discussed
```

### Known Issues & Fixes Needed:

✅ **Working:** Image URL extraction, OCR text detection, product matching, price display

❌ **Issue 1: Context not always saved**
- **Problem:** Sometimes `last_product_discussed` is not updated
- **File:** [routes/handlers/imageHandler.js:223-246](routes/handlers/imageHandler.js#L223-L246)
- **Fix:** Already has extensive logging, check if conversation record exists

❌ **Issue 2: No image quality validation**
- **Problem:** Blurry images go to AI without validation
- **Fix Needed:** Add image quality check before OCR
- **Suggested:** Use OpenCV or similar to detect blur

✅ **Good:** Extensive debug logging for troubleshooting

---

## Feature 3: Document Retrieval from GCS Bucket

### Current Implementation Status: ⚠️ PARTIALLY IMPLEMENTED

**Location:**
- [services/pdfDeliveryService.js](services/pdfDeliveryService.js) (PDF upload to GCS)
- [services/whatsappService.js](services/whatsappService.js) (sendDocument function)
- Intent detection in smart router

### What's Implemented:

✅ **Sales Order PDF Delivery:**
- After order confirmation, system generates PDF
- Uploads to GCS bucket
- Sends download link via WhatsApp
- Location: [services/pdfDeliveryService.js:102-128](services/pdfDeliveryService.js#L102-L128)

### What's Missing:

❌ **Product Catalogs Retrieval:**
- No service to fetch pre-uploaded catalogs from GCS
- No intent detection for "send catalog" requests

❌ **Technical PDFs Retrieval:**
- No service to fetch technical documentation from GCS
- No mapping of product → technical PDF

❌ **Product Images Retrieval:**
- No service to fetch product images from GCS
- No product image gallery system

### Required Fixes:

#### Fix 1: Create Document Retrieval Service

**File to Create:** `services/documentRetrievalService.js`

```javascript
// Required functionality:
1. List documents in GCS bucket by category (catalogs, technical, images)
2. Search for documents by product name/code
3. Generate temporary signed URLs for secure access
4. Cache frequently requested documents
```

#### Fix 2: Add Intent Detection for Document Requests

**File to Modify:** [services/intentRecognitionService.js](services/intentRecognitionService.js)

```javascript
// Add new intents:
- REQUEST_CATALOG
- REQUEST_TECHNICAL_PDF
- REQUEST_PRODUCT_IMAGE
- REQUEST_PRICE_LIST

// Example patterns:
- "send me the catalog"
- "do you have technical specs for 8x80?"
- "show me product images"
- "latest price list"
```

#### Fix 3: GCS Bucket Structure

**Required folder structure in GCS:**
```
gs://your-bucket/
  ├── catalogs/
  │   ├── main_catalog_2025.pdf
  │   └── seasonal_offers.pdf
  ├── technical_docs/
  │   ├── NFF_8x80_specs.pdf
  │   ├── NFF_10x100_specs.pdf
  │   └── installation_guide.pdf
  ├── product_images/
  │   ├── NFF_8x80_01.jpg
  │   ├── NFF_8x80_02.jpg
  │   └── NFF_10x100_01.jpg
  └── pricelists/
      └── pricelist_2025.pdf
```

#### Fix 4: Admin Upload Interface

**Required:**
- Web interface for admins to upload documents to GCS
- Tag documents with product codes
- Set document types (catalog, technical, image, pricelist)

### Testing Plan (After Implementation):

- [ ] **Test 1:** Request catalog
  - Send: "send me the catalog"
  - Should receive: PDF download link from GCS

- [ ] **Test 2:** Request product-specific doc
  - Send: "technical specs for NFF 8x80"
  - Should receive: Relevant technical PDF

- [ ] **Test 3:** Request product images
  - Send: "show me pictures of 10x100"
  - Should receive: Image carousel or links

- [ ] **Test 4:** Request price list
  - Send: "latest price list"
  - Should receive: Current pricelist PDF

### Implementation Priority:

1. **HIGH:** Create `documentRetrievalService.js` with GCS integration
2. **HIGH:** Add intent detection for document requests
3. **MEDIUM:** Create admin upload interface
4. **LOW:** Add image gallery/carousel display

---

## Quick Test Commands

### For Broadcast:
```bash
# As admin, send to your WhatsApp:
/broadcast_now "Test" "Hello!"

# Then upload Excel file with format:
# Column A: Phone numbers
# 919106886259
# 919876543210
```

### For Image Recognition:
```bash
# As customer, just send a product image
# Bot should respond automatically with product details
```

### For Document Retrieval (After Implementation):
```bash
# As customer:
"send me the catalog"
"technical specs for 8x80"
"show product images"
```

---

## Configuration Check

### Environment Variables Required:

#### For Broadcast:
- `MAYTAPI_PRODUCT_ID` - Your Maytapi product ID
- `MAYTAPI_API_KEY` - Your Maytapi API key
- Database tables: `bulk_schedules`, `broadcast_processing_lock`, `broadcast_batch_log`

#### For Image Recognition:
- `OPENAI_API_KEY` - OpenAI API key for Vision
- Database tables: `products`, `conversations`

#### For Document Retrieval:
- `GOOGLE_CLOUD_STORAGE_BUCKET` - GCS bucket name
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to service account JSON
- `GOOGLE_CLOUD_PROJECT_ID` - Your GCP project ID

---

## Database Schema Check

### Required Tables:

1. **bulk_schedules** - Broadcast message queue
2. **broadcast_processing_lock** - Prevent concurrent processing
3. **broadcast_batch_log** - Track batch execution
4. **products** - Product catalog
5. **conversations** - Customer conversation context
6. **unsubscribed_users** - Opt-out list
7. **orders** - Order history

---

## Next Steps

1. ✅ Broadcast: Test current implementation
2. ✅ Image Recognition: Test current implementation
3. ❌ Document Retrieval: **NEEDS IMPLEMENTATION**
   - Create `documentRetrievalService.js`
   - Add intent detection
   - Upload sample documents to GCS
   - Test retrieval

---

## Support & Debugging

### Enable Debug Logging:
```bash
export DEBUG_BROADCAST=1
```

### Check Logs:
```bash
gcloud app logs read --limit=100
# or
cat app_logs.txt | grep -E "BROADCAST|IMAGE|OCR|DOCUMENT"
```

### Common Issues:

**Broadcast not sending:**
- Check `bulk_schedules` table for status
- Verify cron job is running
- Check cooldown hasn't blocked processing

**Image recognition failing:**
- Check OpenAI API quota
- Verify image URL is accessible
- Check products table for matching items

**Documents not retrieving:**
- Verify GCS bucket permissions
- Check service account has storage.objects.get permission
- Verify files exist in bucket

---

*Last Updated: October 22, 2025*
*Version: auto-deploy-20251022-225651*
