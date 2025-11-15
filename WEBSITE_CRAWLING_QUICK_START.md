# 🚀 Quick Start: Website Content Crawling

**Get started in 5 minutes!**

---

## Step 1: Enable Vector Extension in Supabase

1. Go to your Supabase Dashboard
2. Open the SQL Editor
3. Run this command:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## Step 2: Run Database Migration

1. In Supabase SQL Editor, paste and execute the entire contents of:
   `migrations/create_website_embeddings.sql`

2. Verify tables were created:
```sql
SELECT * FROM website_embeddings LIMIT 1;
SELECT * FROM crawl_jobs LIMIT 1;
```

---

## Step 3: Access Dashboard

1. Open your dashboard: `https://your-app-url.com/dashboard.html`
2. Login with your credentials
3. Click on the **"Website Content"** tab

---

## Step 4: Crawl Your First Page

1. Enter a product page URL, example:
   ```
   https://yourwebsite.com/products/sample-product
   ```

2. Click **"Crawl"**

3. Wait 5-30 seconds for processing

4. You should see:
   - ✅ Success message with number of chunks created
   - ✅ URL appears in the table below
   - ✅ Stats updated at the top

---

## Step 5: Test Search

1. In the **"Test Search"** section, enter a query:
   ```
   What are the specifications of [your product]?
   ```

2. Click **"Search"**

3. View the results - should show relevant content from your crawled page

---

## Step 6: Integrate with Chat (Optional)

To make customers benefit from website content automatically, add to your `customerHandler.js`:

```javascript
// At the top
const { 
    searchWebsiteForQuery, 
    enhancePromptWithWebsiteContent, 
    isProductInfoQuery 
} = require('../services/websiteContentIntegration');

// In your chat handler function, before calling OpenAI:
if (isProductInfoQuery(userQuery)) {
    const websiteContext = await searchWebsiteForQuery(
        userQuery, 
        tenantId, 
        extractedProductCode
    );
    
    if (websiteContext && websiteContext.found) {
        systemPrompt = enhancePromptWithWebsiteContent(
            systemPrompt, 
            websiteContext
        );
    }
}
```

---

## ✅ You're Done!

Your AI assistant can now:
- ✅ Search through crawled website content
- ✅ Answer questions with accurate information
- ✅ Provide product specs, pricing, and details
- ✅ Reference official sources from your website

---

## 🎯 Next Steps

### Crawl More Content

Add these types of pages:
- Product detail pages
- Technical specification pages  
- Pricing pages
- FAQ pages
- Feature comparison pages

### Recommended Workflow

1. **Week 1:** Crawl 10-20 key product pages
2. **Week 2:** Test search with common customer questions
3. **Week 3:** Integrate with chat handler
4. **Week 4:** Monitor and optimize

### Maintenance Schedule

- **Daily:** Check crawl jobs for errors
- **Weekly:** Re-crawl frequently updated pages
- **Monthly:** Review and clean old content
- **Quarterly:** Evaluate search quality and coverage

---

## 🆘 Need Help?

**Common Issues:**

1. **Crawl fails:** Check if the URL is accessible and not blocked by robots.txt
2. **No search results:** Lower the similarity threshold or add more pages
3. **Slow search:** Ensure IVFFlat index was created in Step 2

**Full Documentation:** See `WEBSITE_CRAWLING_IMPLEMENTATION.md`

---

## 💡 Pro Tips

1. **Start small** - Crawl 5-10 pages first to test
2. **Use filters** - Exclude navigation, ads, and footers for better results
3. **Test search** - Before integrating, test thoroughly in dashboard
4. **Monitor costs** - OpenAI embeddings cost ~$0.02-0.10 per page
5. **Schedule re-crawls** - Keep content fresh for best results

---

**Ready to go!** 🎉

Your website content is now searchable by your AI assistant!
