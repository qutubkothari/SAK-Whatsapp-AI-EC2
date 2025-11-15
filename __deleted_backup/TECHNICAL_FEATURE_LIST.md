# SAK WhatsApp AI Sales Assistant - Technical Feature List

**Version:** 1.0
**Last Updated:** October 22, 2025
**Deployment:** auto-deploy-20251022-231037

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Core Platform Features](#core-platform-features)
3. [AI & Intelligence Features](#ai--intelligence-features)
4. [Customer Experience Features](#customer-experience-features)
5. [E-Commerce Features](#e-commerce-features)
6. [Marketing & Automation](#marketing--automation)
7. [Integration Capabilities](#integration-capabilities)
8. [Analytics & Reporting](#analytics--reporting)
9. [Admin & Management](#admin--management)
10. [Security & Compliance](#security--compliance)

---

## System Architecture

### Technology Stack

**Backend:**
- Node.js runtime
- Express.js web framework
- PostgreSQL database (Supabase)
- Google Cloud Platform (App Engine, Cloud Storage)

**AI/ML:**
- OpenAI GPT-4o (advanced reasoning)
- OpenAI GPT-4o-mini (fast responses)
- OpenAI text-embedding-3-small (semantic search)
- Custom NLP models for intent classification

**Messaging:**
- Maytapi WhatsApp Business API
- Webhook-based message processing
- Real-time message normalization

**Storage:**
- Supabase PostgreSQL (structured data)
- Google Cloud Storage (documents, images)
- In-memory caching (conversation state)

### Scalability

- **Concurrent Connections:** Unlimited
- **Messages/Second:** 100+ (rate-limited by WhatsApp provider)
- **Response Time:** < 2 seconds average
- **Uptime:** 99.9% SLA
- **Data Storage:** Unlimited (cloud-based)

---

## Core Platform Features

### 1. Message Processing Engine

#### Message Types Supported:
- ✅ Text messages
- ✅ Image uploads (JPG, PNG, WebP)
- ✅ Document uploads (PDF, Excel, CSV)
- ✅ Audio messages (OGG, MP3)
- ✅ Voice notes
- ✅ Location sharing
- ✅ Contact cards

#### Processing Pipeline:
1. **Webhook Reception** - Receives WhatsApp messages via webhook
2. **Message Normalization** - Standardizes format across providers
3. **Tenant Resolution** - Identifies business tenant
4. **Admin Detection** - Distinguishes admin from customer
5. **Intent Recognition** - AI-powered intent classification
6. **Context Retrieval** - Loads conversation history
7. **Handler Routing** - Routes to appropriate handler
8. **Response Generation** - Creates contextual response
9. **Outbound Delivery** - Sends response via WhatsApp

#### Advanced Features:
- **Multi-provider Support** - Abstracted WhatsApp API layer
- **Retry Logic** - Automatic retry on failures (3 attempts)
- **Error Recovery** - Graceful degradation
- **Rate Limiting** - Provider-compliant rate limits
- **Message Queue** - Queues messages during high load
- **Idempotency** - Prevents duplicate processing

---

### 2. Conversation Management

#### State Machine:
```
States:
- initial_contact
- browsing_products
- price_inquiry
- negotiating_discount
- building_cart
- reviewing_order
- awaiting_payment
- order_confirmed
- awaiting_shipping_info
- awaiting_address_update
- order_tracking
- support_request
```

#### Context Tracking:
- **Last Message** - Previous customer message
- **Last Intent** - Previously detected intent
- **Last Product Discussed** - Product in context
- **Last Quoted Products** - Products recently quoted
- **Cart State** - Current cart contents
- **Conversation History** - Full message log
- **Customer Metadata** - Preferences, flags, notes

#### Session Management:
- **Session Timeout** - 24 hours of inactivity
- **Session Persistence** - Survives server restarts
- **Multi-device Support** - Syncs across devices
- **Conversation Resumption** - Picks up where left off

---

### 3. Multi-Tenant Architecture

#### Tenant Isolation:
- ✅ Complete data isolation per tenant
- ✅ Separate product catalogs
- ✅ Independent pricing rules
- ✅ Custom branding per tenant
- ✅ Tenant-specific configurations

#### Tenant Management:
- **Tenant Registration** - Onboarding workflow
- **Tenant Settings** - Configurable parameters
- **Tenant Users** - Admin user management
- **Tenant Billing** - Usage tracking
- **Tenant Analytics** - Performance metrics

#### Supported Configurations:
- Business name and details
- Logo and branding colors
- Product catalog source (Zoho/Manual)
- Pricing rules and discounts
- GST and tax settings
- Shipping configurations
- Payment gateway settings
- WhatsApp phone number
- Admin users and permissions

---

## AI & Intelligence Features

### 1. Intent Recognition System

#### Supported Intents (16 Total):
1. **PRICE_INQUIRY** - "How much for 8x80?"
2. **BRAND_INQUIRY** - "Show me NFF products"
3. **DISCOUNT_REQUEST** - "Give me a discount"
4. **COUNTER_OFFER** - "I want it for ₹2500"
5. **ORDER_CONFIRMATION** - "Yes, confirm order"
6. **ADD_PRODUCT** - "Add 8x80 10 cartons"
7. **REMOVE_PRODUCT** - "Remove 8x80"
8. **QUANTITY_UPDATE** - "Change 8x80 to 20 cartons"
9. **PRODUCT_INQUIRY** - "Do you have 10x100?"
10. **ORDER_STATUS** - "Where is my order?"
11. **REQUEST_CATALOG** - "Send me catalog"
12. **REQUEST_PRICE_LIST** - "Latest price list"
13. **REQUEST_TECHNICAL_DOC** - "Tech specs for 8x80"
14. **REQUEST_PRODUCT_IMAGE** - "Show images of 10x100"
15. **GREETING** - "Hi", "Hello"
16. **GENERAL_QUESTION** - General inquiries

#### Intent Classification:
- **AI Model:** GPT-4o-mini
- **Confidence Scoring:** 0.0 to 1.0
- **Fallback Patterns:** Regex-based fallback
- **Context Awareness:** Uses conversation history
- **Multi-language:** English, Hindi, Hinglish

#### Extracted Data:
- Product codes (e.g., "8x80", "NFF 10x100")
- Quantities and units (cartons, pieces, lacs)
- Price mentions (₹2500, 1.45/pc)
- Discount percentages (10%, 5 rupees off)
- Time references (tomorrow, next week)

---

### 2. Smart Product Search

#### Semantic Search:
- **Vector Embeddings** - Products indexed with embeddings
- **Similarity Matching** - Finds products by meaning
- **Fuzzy Matching** - Handles typos and variations
- **Multi-attribute Search** - Name, code, description, category

#### Search Capabilities:
```javascript
Input: "nylon wall plug"
→ Finds: NFF 8x80, NFF 10x100, NFF 8x100
(Even though exact phrase not in database)

Input: "80 size anchor"
→ Finds: NFF 8x80, 8x80 variants
(Understands size context)

Input: "plastic rawl plug"
→ Finds: Nylon frame fixings category
(Understands synonyms)
```

#### Product Matching:
- **Exact Code Match** - Prioritizes exact product codes
- **Partial Match** - Handles partial codes
- **Category Match** - Shows entire categories
- **Brand Match** - Shows all products in brand
- **Similar Products** - Recommends alternatives

---

### 3. AI-Powered Responses

#### Response Generation:
- **Contextual Responses** - Based on conversation history
- **Personalization** - Uses customer name, history
- **Tone Adaptation** - Matches customer's language style
- **Multi-turn Conversations** - Maintains context across turns

#### Response Types:
- **Informational** - Answers questions
- **Transactional** - Processes orders, carts
- **Promotional** - Suggests products, discounts
- **Supportive** - Handles issues, complaints
- **Educational** - Explains products, processes

#### Smart Features:
- **Clarification Questions** - Asks for missing info
- **Confirmation Requests** - Verifies actions
- **Suggestions** - Proactive recommendations
- **Error Handling** - Graceful error messages

---

### 4. Image Recognition

#### Visual Intelligence:
- **Product Recognition** - Identifies products from photos
- **OCR Text Extraction** - Reads text from images
- **Logo Detection** - Recognizes brand logos
- **Quality Assessment** - Checks image quality

#### Supported Use Cases:
- Customer uploads product photo → Bot identifies & quotes price
- Customer uploads product code screenshot → Bot reads & quotes
- Customer uploads catalog page → Bot extracts products
- Admin uploads GST certificate → Bot extracts business info
- Admin uploads shipping slip → Bot extracts LR number

#### Technical Details:
- **Model:** OpenAI GPT-4o (vision)
- **Image Formats:** JPG, PNG, WebP
- **Max Image Size:** 20MB
- **Response Time:** < 5 seconds
- **Accuracy:** ~85-90% for clear images

---

### 5. Predictive Analytics

#### Customer Behavior Prediction:
- **Reorder Prediction** - Predicts when customer will reorder
- **Churn Prediction** - Identifies at-risk customers
- **Lifetime Value** - Predicts customer LTV
- **Lead Scoring** - Scores lead quality

#### Anomaly Detection:
- **Unusual Orders** - Flags unusual quantities/products
- **Fraud Detection** - Detects suspicious patterns
- **Data Quality** - Identifies data inconsistencies
- **Declining Engagement** - Warns of customer disengagement

---

## Customer Experience Features

### 1. Natural Language Understanding

#### Language Support:
- **English** - Full support
- **Hindi** - Full support
- **Hinglish** - Mixed Hindi-English
- **Regional Variations** - Handles dialects

#### Conversational Abilities:
```
Customer: "mujhe 8x80 chahiye 10 carton"
Bot: Understands (Hindi: "I need 8x80, 10 cartons")

Customer: "aur discount bhi dedo"
Bot: Understands (Hindi: "and also give discount")

Customer: "ye NFF wala kya price hai?"
Bot: Understands (Hinglish: "what's the price of this NFF?")
```

---

### 2. Shopping Experience

#### Product Discovery:
- **Browse by Category** - "Show me all nylon anchors"
- **Search by Code** - "8x80 price"
- **Search by Description** - "wall mounting plugs"
- **Image Search** - Upload photo of product
- **Voice Search** - Send voice note (transcribed)

#### Cart Management:
```
Commands Supported:
- "Add 8x80 10 cartons"
- "Also add 10x100 5 cartons"
- "Remove 8x80"
- "Change 8x80 quantity to 20"
- "Show my cart"
- "Clear cart"
- "Checkout"
```

#### Pricing Transparency:
```
Price Display Format:
━━━━━━━━━━━━━━━━━━━━
NFF 8x80
- 100 cartons @ ₹2,511/carton
- Per piece: ₹1.67
- Total: ₹2,51,100

Discount: -₹25,110 (10%)
Subtotal: ₹2,25,990
Shipping: ₹1,500
GST (18%): ₹40,678
━━━━━━━━━━━━━━━━━━━━
GRAND TOTAL: ₹2,68,168
```

---

### 3. Order Management

#### Order Placement:
1. Customer adds products to cart
2. Reviews cart with "show cart"
3. Says "checkout" or "confirm order"
4. Bot shows final pricing
5. Collects shipping address
6. Collects GST (if needed)
7. Creates order in system + Zoho
8. Sends confirmation

#### Order Tracking:
- **Order Status** - "Where is my order?"
- **Shipment Tracking** - Real-time LR tracking
- **Delivery Updates** - Proactive notifications
- **Issue Resolution** - Support for problems

#### Order History:
- **Past Orders** - "Show my previous orders"
- **Reorder** - "Reorder my last order"
- **Invoice Download** - "Send invoice for order #123"

---

### 4. Personalization

#### Customer Recognition:
- Greets returning customers by name
- Remembers product preferences
- Recalls previous purchases
- Offers personalized discounts

#### Personalized Pricing:
- **First-time Customers** - Standard pricing
- **Repeat Customers** - Last purchase price
- **Loyal Customers** - Volume discount tiers
- **VIP Customers** - Special negotiated rates

#### Smart Recommendations:
- "Customers who bought 8x80 also bought 10x100"
- "Based on your history, you might need..."
- "Reorder reminder: You usually order every 2 months"
- "Trending products in your category"

---

## E-Commerce Features

### 1. Product Management

#### Product Data Model:
```javascript
{
  id: "uuid",
  tenant_id: "uuid",
  product_code: "8x80",
  name: "NFF 8x80",
  description: "Nylon Frame Fixing 8x80mm",
  category: "Nylon Anchors",
  brand: "NFF",
  price_per_carton: 2511,
  pieces_per_carton: 1500,
  price_per_piece: 1.67,
  gst_rate: 18,
  in_stock: true,
  stock_quantity: 5000,
  min_order_quantity: 1,
  image_url: "https://...",
  specifications: {...},
  embeddings: [vector array]
}
```

#### Product Operations:
- **Bulk Import** - Import from Excel/Zoho
- **Price Updates** - Sync from Zoho
- **Stock Management** - Track inventory
- **Product Variants** - Handle variations
- **Product Bundles** - Group products

---

### 2. Pricing Engine

#### Price Components:
1. **Base Price** - From product catalog
2. **Volume Discount** - Quantity-based tiers
3. **Customer Discount** - Negotiated rates
4. **Seasonal Discount** - Promotional offers
5. **GST** - 18% (CGST/SGST or IGST)
6. **Shipping** - Based on weight/cartons
7. **Rounding** - Rounds up to nearest rupee

#### Discount System:

**Volume Discounts:**
```javascript
Discount Tiers:
- 1-9 cartons: 0% discount
- 10-49 cartons: 5% discount
- 50-99 cartons: 8% discount
- 100+ cartons: 10% discount
```

**Negotiated Discounts:**
- Saved per customer per product
- Expires after set period
- Can be overridden by admin
- Tracked in negotiation log

---

### 3. Cart & Checkout

#### Shopping Cart:
```sql
Table: carts
- id (uuid)
- tenant_id (uuid)
- customer_phone (text)
- status (active/abandoned/checked_out)
- created_at (timestamp)
- updated_at (timestamp)

Table: cart_items
- id (uuid)
- cart_id (uuid)
- product_id (uuid)
- quantity (integer)
- unit (cartons/pieces)
- price_per_unit (numeric)
- discount_percent (numeric)
- created_at (timestamp)
```

#### Cart Features:
- **Persistent Cart** - Saved across sessions
- **Multi-product** - Unlimited items
- **Quantity Editing** - Update quantities anytime
- **Price Lock** - Prices locked at add time
- **Discount Application** - Per-item discounts
- **Cart Expiry** - Abandoned cart detection

---

### 4. Order Processing

#### Order Workflow:
```
1. Cart Checkout
2. Address Collection
3. GST Collection (optional)
4. Order Creation (Local DB)
5. Zoho Sync (Sales Order)
6. Payment Processing
7. Order Confirmation (WhatsApp)
8. Invoice Generation
9. Shipment Booking
10. LR Tracking Setup
11. Delivery Confirmation
```

#### Order Data Model:
```sql
Table: orders
- id (uuid)
- tenant_id (uuid)
- customer_phone (text)
- customer_name (text)
- customer_company (text)
- customer_gst (text)
- shipping_address (text)
- shipping_city (text)
- shipping_state (text)
- shipping_pincode (text)
- transporter_name (text)
- transporter_contact (text)
- subtotal (numeric)
- discount_amount (numeric)
- shipping_charges (numeric)
- gst_amount (numeric)
- grand_total (numeric)
- status (pending/confirmed/shipped/delivered)
- zoho_sales_order_id (text)
- lr_number (text)
- created_at (timestamp)
```

---

### 5. Payment Integration

#### Payment Methods Supported:
- Bank Transfer (Manual)
- UPI (Manual verification)
- Credit Terms (B2B customers)
- Payment Gateway (Coming soon)

#### Payment Tracking:
- Payment status per order
- Payment reminders
- Receipt generation
- Credit limit monitoring

---

## Marketing & Automation

### 1. Broadcast System

#### Campaign Types:
- **Text Broadcast** - Plain text messages
- **Image Broadcast** - Images with captions
- **Scheduled Broadcast** - Future scheduled
- **Immediate Broadcast** - Send now

#### Broadcast Features:
- **Excel Upload** - Upload contact lists
- **Rate Limiting** - 5 messages/batch, 1-min cooldown
- **Unsubscribe Management** - Respects opt-outs
- **Retry Logic** - 3 retries on failure
- **Status Tracking** - Per-message status
- **Campaign Analytics** - Delivery and engagement stats

#### Admin Commands:
```
/broadcast "Campaign Name" "tomorrow 10am" "Message text"
/broadcast_now "Campaign Name" "Message text"
/broadcast_image "Campaign Name" "time" "Caption"
/broadcast_image_now "Campaign Name" "Caption"
```

---

### 2. Proactive Messaging

#### Automated Triggers:
- **Welcome Message** - New customer onboarding
- **Reorder Reminder** - Based on purchase cycle
- **Cart Abandonment** - Reminder after 24hrs
- **Order Updates** - Shipment status changes
- **Payment Reminders** - Overdue invoices
- **Review Requests** - Post-delivery feedback

#### Smart Timing:
- Analyzes customer engagement patterns
- Sends at optimal times for each customer
- Respects quiet hours (9 PM - 9 AM)
- Avoids message fatigue

---

### 3. Customer Segmentation

#### Segmentation Criteria:
- **Purchase Frequency** - Daily, weekly, monthly buyers
- **Spending Tier** - Low, medium, high value
- **Product Affinity** - Product preferences
- **Engagement Level** - Active, declining, churned
- **Loyalty Status** - New, returning, VIP

#### Segment Actions:
- Targeted broadcast campaigns
- Personalized discounts
- Exclusive offers
- Priority support

---

## Integration Capabilities

### 1. Zoho Books Integration

#### Zoho Sync Features:
- **Two-way Sync** - WhatsApp ↔ Zoho
- **Customer Sync** - Contacts auto-created
- **Product Sync** - Catalog from Zoho
- **Price Sync** - Real-time pricing
- **Order Sync** - Sales orders created
- **Invoice Sync** - Invoices generated
- **Payment Sync** - Payment status

#### OAuth Authentication:
- Multi-tenant OAuth
- Token auto-refresh
- Secure token storage
- Organization-level access

---

### 2. Google Cloud Integration

#### Cloud Services Used:
- **App Engine** - Application hosting
- **Cloud Storage** - Document/image storage
- **Cloud SQL** - Database (via Supabase)
- **Cloud Run** - VRL scraper service
- **Cloud Logging** - Centralized logs

#### Storage Features:
- **Document Storage** - Catalogs, PDFs, images
- **Signed URLs** - Temporary access (60 min)
- **CDN Delivery** - Fast global access
- **Automatic Backup** - Daily backups

---

### 3. WhatsApp Business API

#### Provider: Maytapi
- **Multi-device Support** - Works on phone + web
- **Rich Media** - Images, documents, audio
- **Read Receipts** - Delivery confirmation
- **Typing Indicators** - Shows "typing..."
- **Quick Replies** - Button support (coming soon)

#### Webhook Processing:
- Real-time message reception
- Webhook validation
- Duplicate prevention
- Error recovery

---

### 4. OpenAI Integration

#### Models Used:
- **GPT-4o** - Advanced reasoning, vision
- **GPT-4o-mini** - Fast responses, classification
- **text-embedding-3-small** - Vector embeddings

#### API Features:
- Cost tracking and optimization
- Request caching
- Error handling and retries
- Token limit management

---

## Analytics & Reporting

### 1. Customer Analytics

**Metrics Tracked:**
- Total customers
- New customers (daily, weekly, monthly)
- Active vs inactive customers
- Customer lifetime value
- Average order value
- Purchase frequency
- Customer retention rate
- Churn rate

**Insights:**
- Top customers by revenue
- Most active customers
- At-risk customers
- High-potential leads

---

### 2. Sales Analytics

**Metrics:**
- Total revenue (daily, weekly, monthly)
- Orders placed
- Average order value
- Conversion rate (inquiry → order)
- Products sold
- Revenue by product/category
- Sales by customer segment

**Trends:**
- Sales growth rate
- Seasonal patterns
- Product performance
- Customer acquisition cost

---

### 3. Operational Metrics

**Bot Performance:**
- Messages processed
- Response time (avg, p50, p95)
- Intent detection accuracy
- Conversation completion rate
- Handover rate (bot → human)

**System Health:**
- Uptime percentage
- Error rate
- API costs (OpenAI)
- Storage usage

---

## Admin & Management

### 1. Admin Dashboard

**Real-time Metrics:**
- Active conversations
- Orders today
- Revenue today
- Pending broadcasts
- System health

**Quick Actions:**
- Send broadcast
- View customer details
- Process order
- Generate report

---

### 2. Admin Commands

**Available Commands:**
```
/broadcast - Send campaigns
/view_cart - View any customer's cart
/clearcart - Clear customer cart
/checkout - Force checkout
/help - Command help
/status - System status
```

---

### 3. User Management

**Roles:**
- **Super Admin** - Full access
- **Admin** - Most features
- **Sales Rep** - Customer interaction only
- **Viewer** - Read-only analytics

---

## Security & Compliance

### 1. Data Security

**Encryption:**
- TLS 1.3 in transit
- AES-256 at rest
- Encrypted database
- Secure API keys

**Access Control:**
- Role-based access (RBAC)
- Multi-factor auth (optional)
- IP whitelisting
- Audit logging

---

### 2. Compliance

**Standards:**
- GDPR-ready
- Data residency (India)
- GST compliance
- WhatsApp Business Policy

**Customer Rights:**
- Right to access data
- Right to delete data
- Right to export data
- Unsubscribe anytime

---

## Technical Specifications

**Infrastructure:**
- **Hosting:** Google Cloud App Engine
- **Database:** PostgreSQL 14 (Supabase)
- **Runtime:** Node.js 18+
- **Framework:** Express.js 4.x

**Performance:**
- **Response Time:** < 2s average
- **Throughput:** 100+ messages/sec
- **Uptime:** 99.9% SLA
- **Scalability:** Auto-scaling

**APIs:**
- **REST API** - JSON over HTTPS
- **Webhook** - Async message delivery
- **GraphQL** - Advanced queries (coming soon)

---

**Total Features:** 200+
**Total Services:** 120+
**Total API Endpoints:** 30+
**Supported Languages:** 3 (English, Hindi, Hinglish)
**Integration Partners:** 4 (Zoho, OpenAI, Google Cloud, Maytapi)

---

*For customer-facing brochure, see [CUSTOMER_BROCHURE.md](CUSTOMER_BROCHURE.md)*
