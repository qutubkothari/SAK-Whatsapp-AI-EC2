# 🌐 Website Content Crawling & Embedding System

**Complete Implementation Guide**  
**Date:** October 26, 2025  
**Feature:** Semantic search over website content for customer queries

---

## 📋 Overview

This system enables your WhatsApp AI Sales Assistant to:
- Crawl product pages, technical specs, and pricing information from your website
- Convert content into searchable embeddings using OpenAI
- Answer customer questions using real website content
- Provide accurate product specifications and pricing from official sources

---

## 🏗️ Architecture

### Components Created

1. **Database Layer** (`migrations/create_website_embeddings.sql`)
   - `website_embeddings` table - Stores crawled content chunks with vector embeddings
   - `crawl_jobs` table - Tracks crawling jobs and status
   - PostgreSQL vector search function using cosine similarity

2. **Services Layer**
   - `webCrawlerService.js` - HTTP crawler with HTML parsing
   - `websiteEmbeddingService.js` - Text chunking and OpenAI embedding generation
   - `websiteSearchService.js` - Semantic search over embeddings
   - `websiteContentIntegration.js` - Integration with customer chat handler

3. **API Layer** (`routes/api/websiteContent.js`)
   - POST `/api/dashboard/website-content/crawl/:tenantId` - Crawl single URL
   - POST `/api/dashboard/website-content/crawl-batch/:tenantId` - Crawl multiple URLs
   - GET `/api/dashboard/website-content/list/:tenantId` - List crawled URLs
   - GET `/api/dashboard/website-content/stats/:tenantId` - Get statistics
   - POST `/api/dashboard/website-content/search/:tenantId` - Search content
   - DELETE `/api/dashboard/website-content/:tenantId` - Delete URL content
   - GET `/api/dashboard/website-content/jobs/:tenantId` - View crawl history
   - GET `/api/dashboard/website-content/product/:tenantId/:productCode` - Find product info

4. **Dashboard UI** (`public/dashboard.html`)
   - New "Website Content" tab
   - URL crawling interface
   - Content search testing
   - Crawled URLs management

---

## 🚀 Setup Instructions

### Step 1: Run Database Migration

Execute the SQL migration in your Supabase SQL Editor:

```bash
# File: migrations/create_website_embeddings.sql
```

This creates:
- ✅ `website_embeddings` table with vector column
- ✅ `crawl_jobs` table for job tracking
- ✅ Vector similarity search function
- ✅ Indexes for performance (including IVFFlat for vector search)

**Important:** Enable the `vector` extension in Supabase:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Step 2: Install Dependencies

Dependencies are already in `package.json`:
- ✅ `axios` - HTTP requests for crawling
- ✅ `cheerio` - HTML parsing
- ✅ `openai` - Embedding generation

### Step 3: Configure Environment Variables

Ensure your `.env` file has:
```env
OPENAI_API_KEY=your_openai_api_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

### Step 4: Deploy

```bash
.\deploy.ps1
```

---

## 📖 Usage Guide

### For Administrators (Dashboard)

#### 1. Crawl Website Content

1. Navigate to the **"Website Content"** tab in the dashboard
2. Enter a URL (product page, specs page, or pricing page)
3. Click **"Crawl"**
4. Wait for processing (usually 5-30 seconds depending on page size)
5. View the crawled content in the list below

**Example URLs to crawl:**
```
https://yourwebsite.com/products/nff-640
https://yourwebsite.com/technical-specifications
https://yourwebsite.com/pricing
```

#### 2. Test Search

1. Use the **"Test Search"** section
2. Enter a query like: "What are the specifications of NFF 6x40?"
3. Click **"Search"**
4. View matching content with relevance scores

#### 3. Manage Content

- **View all crawled URLs** in the table
- **Delete old content** by clicking the trash icon
- **Re-crawl** by entering the same URL again (old content is replaced)
- **View statistics** in the stats cards at the top

---

### For Customers (WhatsApp Chat)

Customers can now ask questions like:

**Product Specifications:**
```
Customer: "What are the specs for NFF 640?"
Bot: [Responds with actual specs from your website]
```

**Pricing Information:**
```
Customer: "How much does the NFF 6x40 cost?"
Bot: [Responds with current pricing from website]
```

**Technical Details:**
```
Customer: "Tell me about the technical features of product XYZ"
Bot: [Responds with detailed info from crawled technical pages]
```

---

## 🔧 Integration with AI Chat

### Automatic Integration

To integrate website content search into customer queries, modify your `customerHandler.js`:

```javascript
const { 
    searchWebsiteForQuery, 
    enhancePromptWithWebsiteContent, 
    isProductInfoQuery 
} = require('../services/websiteContentIntegration');

async function handleCustomerQuery(tenantId, userQuery, productCode) {
    let systemPrompt = "You are a helpful sales assistant...";
    
    // Check if query is asking for product info
    if (isProductInfoQuery(userQuery)) {
        // Search website content
        const websiteContext = await searchWebsiteForQuery(
            userQuery, 
            tenantId, 
            productCode
        );
        
        // Enhance prompt with website content
        if (websiteContext && websiteContext.found) {
            systemPrompt = enhancePromptWithWebsiteContent(
                systemPrompt, 
                websiteContext
            );
            console.log(`[WebsiteIntegration] Found ${websiteContext.count} relevant sources`);
        }
    }
    
    // Continue with AI request using enhanced prompt...
}
```

---

## ⚙️ Configuration Options

### Crawling Options

When calling the crawl API, you can customize:

```javascript
{
    url: "https://example.com/product",
    options: {
        timeout: 10000,              // Request timeout (ms)
        maxDepth: 1,                 // How deep to crawl links
        maxPages: 10,                // Max pages to crawl
        followLinks: false,          // Whether to follow internal links
        contentSelectors: [          // CSS selectors for content
            'main', 
            'article', 
            '.product-details'
        ],
        excludeSelectors: [          // Elements to exclude
            'script', 
            'style', 
            'nav', 
            'footer', 
            '.advertisement'
        ],
        delayBetweenRequests: 1000   // Delay for batch crawling (ms)
    }
}
```

### Chunking Options

In `websiteEmbeddingService.js`:

```javascript
{
    chunkSize: 1000,        // Characters per chunk
    chunkOverlap: 200,      // Overlap between chunks
    minChunkSize: 100       // Minimum chunk size
}
```

### Search Options

When searching content:

```javascript
{
    limit: 5,                // Max results to return
    contentType: 'product_page',  // Filter by type (optional)
    minSimilarity: 0.7,     // Minimum similarity score (0-1)
    includeMetadata: true   // Include source URLs, etc.
}
```

---

## 📊 Database Schema

### `website_embeddings` Table

```sql
id               UUID PRIMARY KEY
tenant_id        UUID (FK to tenants)
url              TEXT
page_title       TEXT
content_type     VARCHAR(50)  -- product_page, technical_spec, pricing, faq, general
original_content TEXT          -- Full page content
chunk_text       TEXT          -- Chunked text for embedding
chunk_index      INTEGER       -- Order of chunk
embedding        vector(1536)  -- OpenAI embedding
product_codes    TEXT[]        -- Array of product codes mentioned
keywords         TEXT[]        -- Extracted keywords
status           VARCHAR(20)   -- active, archived, error
crawl_date       TIMESTAMP
last_updated     TIMESTAMP
```

**Indexes:**
- `tenant_id` (for tenant isolation)
- `(tenant_id, url)` (for finding specific URLs)
- `(tenant_id, content_type)` (for filtering by type)
- `embedding` using IVFFlat (for vector similarity search)

### `crawl_jobs` Table

```sql
id               UUID PRIMARY KEY
tenant_id        UUID (FK to tenants)
url              TEXT
status           VARCHAR(20)   -- pending, processing, completed, failed
pages_crawled    INTEGER
chunks_created   INTEGER
error_message    TEXT
started_at       TIMESTAMP
completed_at     TIMESTAMP
created_at       TIMESTAMP
```

---

## 🔍 How It Works

### 1. Crawling Process

```
User enters URL → Fetch HTML → Parse with Cheerio → Extract text content
→ Remove unwanted elements → Clean whitespace → Extract metadata
```

### 2. Chunking Process

```
Full text → Split by paragraphs → Create chunks (~1000 chars)
→ Add overlap (200 chars) → Extract keywords → Detect content type
```

### 3. Embedding Generation

```
Text chunk → OpenAI API (text-embedding-3-small) → 1536-dimension vector
→ Store in database → Create vector index
```

### 4. Search Process

```
Customer query → Generate query embedding → Vector similarity search
→ Find top N matches (cosine similarity) → Filter by threshold
→ Return relevant content → Enhance AI response
```

---

## 📈 Performance Considerations

### Embedding Costs

- OpenAI `text-embedding-3-small`: $0.00002 per 1K tokens
- Average webpage: ~1000-5000 tokens
- **Cost per page:** $0.02 - $0.10

### Storage

- Each chunk: ~1KB text + 6KB embedding = ~7KB
- 1000 chunks = ~7MB storage
- PostgreSQL vector indexes add ~20% overhead

### Search Speed

- Vector similarity search: ~10-50ms for 1000 chunks
- With IVFFlat index: ~1-5ms
- Full query (with AI): 500-2000ms total

---

## 🎯 Best Practices

### Content to Crawl

✅ **DO crawl:**
- Product detail pages
- Technical specification sheets
- Pricing pages
- FAQ pages
- Feature comparison pages

❌ **DON'T crawl:**
- Blog posts (too much content)
- News articles (time-sensitive)
- User-generated content
- Dynamic pages requiring JavaScript

### Maintenance

1. **Re-crawl regularly** - Update content weekly or monthly
2. **Monitor crawl jobs** - Check for failed crawls
3. **Clean old content** - Remove outdated pages
4. **Review search quality** - Test common queries periodically

### Optimization

1. **Use specific selectors** - Target main content areas only
2. **Exclude navigation** - Remove headers, footers, sidebars
3. **Chunk appropriately** - Balance between context and precision
4. **Set similarity threshold** - Adjust `minSimilarity` based on results

---

## 🐛 Troubleshooting

### Issue: Crawl fails with timeout

**Solution:**
- Increase timeout in options
- Check if website blocks bots (User-Agent)
- Try crawling individual pages instead of following links

### Issue: No search results

**Solution:**
- Check if content was actually crawled (view table)
- Lower `minSimilarity` threshold (try 0.6)
- Verify embeddings were generated (check chunks count)
- Try different search keywords

### Issue: Poor search relevance

**Solution:**
- Re-crawl with better content selectors
- Adjust chunk size (smaller chunks = more precise)
- Add more source pages to increase coverage
- Review extracted keywords in database

### Issue: Database vector search slow

**Solution:**
- Ensure IVFFlat index is created
- Increase `lists` parameter in index (default: 100)
- Reduce search limit
- Add more specific filters (content_type, product_codes)

---

## 🔒 Security & Multi-Tenancy

### Tenant Isolation

✅ All tables include `tenant_id` column  
✅ All API endpoints filter by `tenant_id`  
✅ Dashboard requires authentication  
✅ No cross-tenant data leakage possible

### Rate Limiting

Consider adding:
- Max crawls per day per tenant
- Max chunks per tenant
- API rate limits on search endpoint

---

## 📝 API Reference

### Crawl Website

```http
POST /api/dashboard/website-content/crawl/:tenantId
Content-Type: application/json
Authorization: Bearer {token}

{
    "url": "https://example.com/product",
    "options": {
        "timeout": 10000
    }
}

Response:
{
    "success": true,
    "jobId": "uuid",
    "url": "https://example.com/product",
    "pageTitle": "Product Name",
    "chunksCreated": 5,
    "wordCount": 1234
}
```

### Search Content

```http
POST /api/dashboard/website-content/search/:tenantId
Content-Type: application/json
Authorization: Bearer {token}

{
    "query": "product specifications",
    "limit": 5,
    "minSimilarity": 0.7
}

Response:
{
    "success": true,
    "query": "product specifications",
    "results": [
        {
            "id": "uuid",
            "url": "https://example.com/specs",
            "pageTitle": "Technical Specifications",
            "content": "Content chunk text...",
            "contentType": "technical_spec",
            "similarity": 0.85,
            "relevanceScore": 85
        }
    ],
    "count": 1
}
```

### List Crawled URLs

```http
GET /api/dashboard/website-content/list/:tenantId
Authorization: Bearer {token}

Response:
{
    "success": true,
    "urls": [
        {
            "url": "https://example.com/product",
            "pageTitle": "Product Name",
            "contentType": "product_page",
            "chunkCount": 5,
            "crawlDate": "2025-10-26T10:00:00Z",
            "status": "active"
        }
    ],
    "count": 1
}
```

---

## 🎓 Example Use Cases

### Use Case 1: Product Catalog

**Scenario:** You have 100 products on your website

**Steps:**
1. Crawl all 100 product pages
2. Each page creates 3-10 chunks
3. Total: 300-1000 searchable chunks
4. Customers can ask about any product
5. AI responds with accurate info from website

### Use Case 2: Technical Support

**Scenario:** Complex products with detailed specifications

**Steps:**
1. Crawl technical specification PDFs or pages
2. Chunk into logical sections (specs, features, compatibility)
3. Customer asks: "Is this compatible with X?"
4. AI searches specs and provides accurate answer

### Use Case 3: Pricing Inquiries

**Scenario:** Dynamic pricing on website

**Steps:**
1. Crawl pricing pages weekly
2. Keep content up-to-date
3. Customer asks for price
4. AI provides current price from website
5. Reduces outdated pricing information

---

## 🚀 Future Enhancements

### Potential Improvements

1. **Automatic Re-crawling** - Schedule daily/weekly re-crawls
2. **Smart Chunking** - Use AI to identify logical sections
3. **Multi-modal Search** - Include images and tables
4. **Query Expansion** - Automatically expand search queries
5. **Relevance Feedback** - Learn from user interactions
6. **Batch Operations** - Crawl entire sitemap at once
7. **Change Detection** - Only re-crawl changed pages
8. **Analytics Dashboard** - Track search patterns and popular content

---

## 📞 Support

If you encounter issues:

1. Check dashboard crawl jobs for error messages
2. Review server logs for detailed errors
3. Verify OpenAI API key is valid
4. Ensure Supabase vector extension is enabled
5. Test with simple pages first before complex sites

---

## ✅ Checklist

Before going live:

- [ ] Database migration executed successfully
- [ ] Vector extension enabled in Supabase
- [ ] OpenAI API key configured
- [ ] Test crawl of 1-2 pages successful
- [ ] Test search returns relevant results
- [ ] Dashboard UI loads and works
- [ ] Integrated with customer chat handler
- [ ] Set up monitoring for crawl failures
- [ ] Document crawling schedule for team
- [ ] Train team on using the feature

---

**End of Documentation**

*For questions or issues, refer to the implementation files or contact the development team.*
