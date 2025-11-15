# SAK WhatsApp AI Sales Assistant

An intelligent WhatsApp-based sales assistant powered by AI that helps businesses manage customer interactions, orders, and sales through WhatsApp.

## Features

### Core Functionality
- **AI-Powered Conversations**: Natural language understanding for customer queries
- **Product Management**: Sync with Zoho Books for real-time product catalog
- **Order Processing**: Complete order flow from cart to checkout with GST calculation
- **Customer Profiles**: Automatic customer profiling and history tracking
- **Smart Pricing**: Personalized pricing, volume discounts, and negotiation handling
- **Dashboard**: Comprehensive web dashboard for monitoring and management

### Advanced Features
- **GST Integration**: Automatic GST number validation and invoice generation
- **Zoho Books Sync**: Two-way sync for products, customers, and orders
- **Shipping Management**: Address collection and shipment tracking
- **Follow-up System**: Automated follow-ups for abandoned carts
- **Document Processing**: PDF and image analysis for business documents
- **Multi-Language Support**: Handle queries in multiple languages
- **Analytics**: Real-time sales insights and customer behavior tracking

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4
- **WhatsApp**: Maytapi API
- **Cloud**: Google App Engine
- **Integration**: Zoho Books API

## Project Structure

```
SAK-Whatsapp-AI-Sales-Assistant/
├── index.js                    # Main application entry point
├── app.yaml                    # Google App Engine configuration
├── package.json                # Dependencies
├── deploy.ps1                  # Deployment script
│
├── routes/                     # API routes and webhooks
│   ├── webhook.js             # WhatsApp webhook handler
│   ├── api.js                 # Main API router
│   ├── api/                   # API endpoints
│   │   ├── dashboard.js       # Dashboard data APIs
│   │   ├── orders.js          # Order management
│   │   ├── zoho.js            # Zoho integration
│   │   └── ...
│   ├── handlers/              # Message handlers
│   │   ├── customerHandler.js # Customer message processing
│   │   ├── adminHandler.js    # Admin commands
│   │   ├── modules/           # Feature modules
│   │   └── customer/          # Customer-specific handlers
│   └── middleware/            # Request middleware
│
├── services/                   # Business logic services
│   ├── config.js              # Configuration management
│   ├── aiService.js           # AI integration
│   ├── productService.js      # Product management
│   ├── orderService.js        # Order processing
│   ├── zoho*.js               # Zoho integrations
│   ├── gstService.js          # GST handling
│   └── ...                    # 100+ specialized services
│
├── public/                     # Frontend assets
│   ├── dashboard.html         # Main dashboard
│   └── index.html             # Landing page
│
└── scripts/                    # Utility scripts
    ├── syncZohoProducts.js    # Product sync utility
    ├── setupZohoOAuth.js      # OAuth setup
    └── ...                    # Maintenance scripts

```

## Setup

### Prerequisites
- Node.js 18+
- Google Cloud Platform account
- Supabase account
- Maytapi WhatsApp Business API
- Zoho Books account
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/qutubkothari/SAK-Whatsapp-AI-Sales-Assistant.git
   cd SAK-Whatsapp-AI-Sales-Assistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file with the following:
   ```env
   # Supabase
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   SUPABASE_ANON_KEY=your_anon_key
   
   # OpenAI
   OPENAI_API_KEY=your_openai_key
   OPENAI_PROJECT=your_project_id
   
   # Maytapi WhatsApp
   MAYTAPI_PRODUCT_ID=your_product_id
   MAYTAPI_PHONE_ID=your_phone_id
   MAYTAPI_API_TOKEN=your_api_token
   
   # Zoho Books
   ZOHO_CLIENT_ID=your_client_id
   ZOHO_CLIENT_SECRET=your_client_secret
   ZOHO_REFRESH_TOKEN=your_refresh_token
   ZOHO_ORG_ID=your_organization_id
   
   # Google Cloud Storage
   GCS_BUCKET_NAME=your_bucket_name
   ```

4. **Setup Zoho OAuth**
   ```bash
   node scripts/setupZohoOAuth.js
   ```

5. **Sync Products**
   ```bash
   node scripts/syncZohoProducts.js
   ```

## Deployment

### Deploy to Google App Engine

```bash
.\deploy.ps1
```

This will:
- Create a new version with timestamp
- Deploy to Google App Engine
- Set traffic to 100% for the new version
- Display deployment status

### Local Development

```bash
npm start
```

The app will run on `http://localhost:8080`

## Usage

### Customer Interaction Flow

1. **Welcome**: Customer sends any message to start
2. **Onboarding**: AI collects business name and GST (if B2B)
3. **Product Inquiry**: Customer asks about products
4. **Cart Management**: Add/remove items, adjust quantities
5. **Discount Negotiation**: AI handles discount requests intelligently
6. **Checkout**: Collect shipping address, generate invoice
7. **Order Confirmation**: Sync with Zoho, send confirmation

### Admin Commands

Send these commands from admin phone numbers:

- `/dashboard` - Get dashboard access link
- `/login` - Get dashboard login link
- `/stats` - Get quick stats
- `/help` - List all commands
- `/broadcast [message]` - Send to all customers
- `/clear [phone]` - Reset customer conversation

### Dashboard Access

1. Send `/login` from admin WhatsApp number
2. Click the magic link received
3. Access the dashboard with 7 tabs:
   - **Overview**: Key metrics and charts
   - **Conversations**: All customer chats
   - **Orders**: Order management
   - **Products**: Product catalog
   - **Settings**: Configuration and Zoho sync
   - **Customers**: Customer list
   - **Analytics**: Detailed insights

## API Endpoints

### Webhook
- `POST /webhook` - WhatsApp message webhook

### Dashboard APIs
- `GET /api/dashboard/stats/:tenantId` - Dashboard statistics
- `GET /api/dashboard/conversations/:tenantId` - Conversations list
- `GET /api/dashboard/orders/:tenantId` - Orders list
- `GET /api/dashboard/products/:tenantId` - Products list
- `POST /api/dashboard/sync-products/:tenantId` - Sync from Zoho

### Admin APIs
- `POST /api/admin/broadcast` - Broadcast message
- `POST /api/admin/clear-conversation` - Reset conversation

## Key Services

### AI Services
- `aiService.js` - Core AI integration
- `aiIntegrationService.js` - Enhanced AI features
- `intentRecognitionService.js` - Intent classification

### Order Services
- `orderService.js` - Order management
- `orderProcessingService.js` - Order workflow
- `orderConfirmationService.js` - Confirmation handling

### Zoho Services
- `zohoTenantAuthService.js` - OAuth management
- `zohoIntegrationService.js` - API integration
- `zohoOrderSyncService.js` - Order sync

### Customer Services
- `customerProfileService.js` - Profile management
- `customerOnboardingService.js` - Onboarding flow
- `gstService.js` - GST validation

## Maintenance

### Database Cleanup
```bash
# Clear stuck conversations
node scripts/clearStuckState.js

# Fix duplicate profiles
node scripts/cleanup_duplicate_gst_profiles.js

# Verify customer data
node scripts/verify_customer_profiles.js
```

### Monitoring
```bash
# Check logs
gcloud app logs tail -s default

# View recent errors
gcloud app logs read --limit=100 --severity=ERROR
```

## Architecture

### Message Processing Flow
```
WhatsApp Message → Webhook → Tenant Resolver → Message Normalizer
    ↓
Admin Detector → [Admin Handler | Customer Handler]
    ↓
Intent Recognition → State Machine → AI Processing
    ↓
Response Generation → Outbound Guard → WhatsApp API
```

### Database Schema
- **tenants**: Business configuration
- **conversations**: Chat sessions
- **messages**: Message history
- **customer_profiles**: Customer data
- **orders**: Order records
- **order_items**: Line items
- **products**: Product catalog
- **cart_items**: Shopping cart

## Configuration

### app.yaml Settings
All environment variables are configured in `app.yaml` for App Engine deployment.

### Feature Flags
Enable/disable features via tenant configuration in database.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues or questions:
- Check logs: `gcloud app logs read`
- Review code comments
- Contact: qutubkothari@gmail.com

## License

Proprietary - SAK Solutions

## Version

Current Version: 1.0.0 (October 2025)
Deployment: Google App Engine
Status: Production

---

**Built with ❤️ by SAK Solutions**
