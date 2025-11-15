# Document Retrieval System - Setup Guide

## Overview
The document retrieval system allows customers to request catalogs, price lists, technical documentation, and product images via WhatsApp. Documents are stored in Google Cloud Storage (GCS) and retrieved on demand.

---

## Prerequisites

1. **Google Cloud Storage Bucket** - Already configured
2. **Service Account** with Storage permissions
3. **Environment Variables** properly set

---

## Step 1: Verify Environment Variables

Ensure these are set in your `app.yaml` or `.env`:

```yaml
env_variables:
  GOOGLE_CLOUD_STORAGE_BUCKET: "your-bucket-name"
  GOOGLE_APPLICATION_CREDENTIALS: "path/to/service-account.json"
  GOOGLE_CLOUD_PROJECT_ID: "your-project-id"
```

---

## Step 2: Create GCS Bucket Folder Structure

Run this script to create the required folder structure in your GCS bucket:

```bash
# Using gsutil (Google Cloud SDK)
gsutil mb gs://your-bucket-name  # Create bucket (if not exists)

# Create folders
gsutil -m mkdir \
  gs://your-bucket-name/catalogs/ \
  gs://your-bucket-name/pricelists/ \
  gs://your-bucket-name/technical_docs/ \
  gs://your-bucket-name/product_images/ \
  gs://your-bucket-name/installation_guides/ \
  gs://your-bucket-name/brochures/
```

**Folder Structure:**
```
gs://your-bucket/
├── catalogs/               # Product catalogs
├── pricelists/            # Price lists
├── technical_docs/        # Technical specifications
│   ├── NFF_8x80_specs.pdf
│   ├── NFF_10x100_specs.pdf
│   └── ...
├── product_images/        # Product photos
│   ├── NFF_8x80_01.jpg
│   ├── NFF_8x80_02.jpg
│   ├── NFF_10x100_01.jpg
│   └── ...
├── installation_guides/   # Installation instructions
└── brochures/            # Marketing brochures
```

---

## Step 3: Upload Sample Documents

### Using gsutil:

```bash
# Upload catalog
gsutil cp main_catalog_2025.pdf gs://your-bucket/catalogs/

# Upload price list
gsutil cp pricelist_2025.pdf gs://your-bucket/pricelists/

# Upload technical docs (use product code in filename)
gsutil cp NFF_8x80_specs.pdf gs://your-bucket/technical_docs/
gsutil cp NFF_10x100_specs.pdf gs://your-bucket/technical_docs/

# Upload product images (use product code in filename)
gsutil cp NFF_8x80_01.jpg gs://your-bucket/product_images/
gsutil cp NFF_10x100_01.jpg gs://your-bucket/product_images/
```

### Using Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/storage)
2. Navigate to your bucket
3. Click **Upload Files** or **Upload Folder**
4. Upload files to the appropriate folder

---

## Step 4: Set Proper Permissions

### Make Bucket Publicly Readable (Recommended for shared documents):

```bash
gsutil iam ch allUsers:objectViewer gs://your-bucket
```

### Or use Signed URLs (More secure):
The system automatically generates signed URLs with 60-minute expiry. No additional setup needed.

---

## Step 5: Configure Tenant-Specific Documents (Optional)

If you have multiple tenants with different catalogs:

1. Add columns to `tenants` table:
```sql
ALTER TABLE tenants
ADD COLUMN catalog_file_path TEXT,
ADD COLUMN price_list_file_path TEXT;
```

2. Update tenant records:
```sql
UPDATE tenants
SET catalog_file_path = 'catalogs/tenant_abc_catalog.pdf',
    price_list_file_path = 'pricelists/tenant_abc_pricelist.pdf'
WHERE id = 'tenant-id-here';
```

---

## Step 6: File Naming Conventions

For the system to automatically find product-specific documents, use these naming conventions:

### Technical Documents:
- Format: `PRODUCTCODE_specs.pdf` or `PRODUCTCODE_technical.pdf`
- Examples:
  - `NFF_8x80_specs.pdf`
  - `NFF_10x100_technical.pdf`
  - `8x80_datasheet.pdf`

### Product Images:
- Format: `PRODUCTCODE_##.jpg` or `PRODUCTCODE_image##.jpg`
- Examples:
  - `NFF_8x80_01.jpg`
  - `NFF_8x80_02.jpg`
  - `10x100_front.jpg`
  - `10x100_side.jpg`

### Catalogs & Price Lists:
- Any name works (system gets latest by date)
- Recommended: Include date in filename
  - `catalog_2025_Q1.pdf`
  - `pricelist_jan_2025.pdf`

---

## Step 7: Test the System

### Test 1: Request Catalog
```
Customer: send me the catalog
Bot: 📘 *Product Catalog*

Here's our latest catalog:
https://storage.googleapis.com/...

_Link expires in 60 minutes_
```

### Test 2: Request Price List
```
Customer: latest price list
Bot: 💰 *Price List*

Here's our latest price list:
https://storage.googleapis.com/...

_Link expires in 60 minutes_
```

### Test 3: Request Technical Docs
```
Customer: technical specs for NFF 8x80
Bot: 📋 *Technical Documentation for NFF 8x80*

1. NFF_8x80_specs.pdf
https://storage.googleapis.com/...

_Links expire in 60 minutes_
```

### Test 4: Request Product Images
```
Customer: show images of 10x100
Bot: 📸 *Product Images for 10x100*

Image 1:
https://storage.googleapis.com/...

Image 2:
https://storage.googleapis.com/...

_Links expire in 60 minutes_
```

---

## Supported Customer Commands

The AI automatically detects these requests:

### Catalogs:
- "send catalog"
- "show me catalog"
- "do you have a catalog?"
- "catalog bhejo"
- "send me your product list"

### Price Lists:
- "send price list"
- "latest prices"
- "rate list"
- "price sheet bhejo"
- "what are your prices"

### Technical Documents:
- "technical specs for 8x80"
- "product specifications"
- "datasheet for NFF 10x100"
- "technical details"
- "8x80 ki technical details chahiye"

### Product Images:
- "show images of 8x80"
- "product photos"
- "picture bhejo"
- "how does 10x100 look"
- "8x80 ki photo dikha"

---

## Admin Upload Interface (To Be Developed)

For easier document management, consider creating a web interface:

### Features Needed:
1. File upload form
2. Category selection dropdown
3. Product code tagging
4. Preview uploaded documents
5. Delete/replace documents

### Endpoint Structure:
```javascript
POST /admin/documents/upload
- category: 'catalog' | 'pricelist' | 'technical' | 'product_image'
- file: multipart/form-data
- productCode: (optional, for product-specific docs)
- metadata: {description, uploadedBy, etc.}

GET /admin/documents/list?category=technical
- Returns list of all documents in category

DELETE /admin/documents/:path
- Removes document from GCS
```

---

## Troubleshooting

### Issue: "GCS not configured" Error

**Solution:**
1. Check environment variables are set
2. Verify service account JSON file path
3. Ensure service account has `storage.objects.get` permission

```bash
# Test GCS access
gcloud auth activate-service-account --key-file=path/to/service-account.json
gsutil ls gs://your-bucket
```

### Issue: "Document not found" Error

**Solution:**
1. Verify file exists in bucket:
   ```bash
   gsutil ls gs://your-bucket/catalogs/
   ```
2. Check file naming matches conventions
3. For product-specific docs, ensure product code is in filename

### Issue: Customer receives broken link

**Solution:**
1. Check if file is publicly readable:
   ```bash
   gsutil ls -L gs://your-bucket/catalogs/file.pdf
   ```
2. Verify signed URL hasn't expired (60 minutes default)
3. Check file actually exists in GCS

### Issue: Wrong document returned

**Solution:**
1. System returns latest file by date
2. If wrong file is latest, rename or delete old files
3. Or configure tenant-specific paths in database

---

## Monitoring & Analytics

Track document requests in logs:

```bash
# View document request logs
gcloud app logs read --limit=100 | grep -E "DOC_REQUEST|DOC_RETRIEVAL"

# Check which documents are most requested
gcloud app logs read --limit=1000 | grep "DOC_REQUEST" | \
  awk '{print $NF}' | sort | uniq -c | sort -rn
```

---

## Security Considerations

### Signed URLs (Current Method - Recommended):
✅ Temporary access (60 minutes)
✅ No public access needed
✅ Revocable

### Public URLs:
✅ Simpler setup
❌ Anyone with link can access
❌ No expiry

**Recommendation:** Keep using signed URLs for sensitive documents (price lists, technical specs). Make catalogs and brochures public for easier sharing.

---

## Batch Upload Script

For uploading multiple documents at once:

```bash
#!/bin/bash
# upload_docs.sh

BUCKET="your-bucket-name"

# Upload all PDFs in a folder
for file in ./technical_docs/*.pdf; do
    filename=$(basename "$file")
    echo "Uploading $filename..."
    gsutil cp "$file" "gs://$BUCKET/technical_docs/$filename"
done

# Upload all images
for file in ./product_images/*.{jpg,png}; do
    filename=$(basename "$file")
    echo "Uploading $filename..."
    gsutil cp "$file" "gs://$BUCKET/product_images/$filename"
done

echo "Upload complete!"
```

Run with:
```bash
chmod +x upload_docs.sh
./upload_docs.sh
```

---

## Next Steps

1. ✅ **Upload initial documents** to GCS bucket
2. ✅ **Test with real customers** to gather feedback
3. ⏳ **Build admin upload interface** for easier management
4. ⏳ **Add analytics** to track most requested documents
5. ⏳ **Create document versioning** system
6. ⏳ **Add multi-language support** for documents

---

## Quick Reference Commands

```bash
# List all documents
gsutil ls -r gs://your-bucket/

# Upload file
gsutil cp local-file.pdf gs://your-bucket/category/

# Delete file
gsutil rm gs://your-bucket/category/file.pdf

# Make file public
gsutil acl ch -u AllUsers:R gs://your-bucket/category/file.pdf

# Generate signed URL manually (for testing)
gsutil signurl -d 1h path/to/service-account.json gs://your-bucket/file.pdf
```

---

## Support

For issues or questions:
1. Check logs: `gcloud app logs read --limit=100`
2. Review [FEATURE_TESTING_GUIDE.md](FEATURE_TESTING_GUIDE.md)
3. Test GCS access: `gsutil ls gs://your-bucket`

---

*Last Updated: October 22, 2025*
*Feature Status: ✅ DEPLOYED*
