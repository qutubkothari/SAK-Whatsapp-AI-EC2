# Quick Start: Document Retrieval Feature

## ⚡ 5-Minute Setup Guide

Your document retrieval feature is **already deployed** and working! You just need to upload documents to Google Cloud Storage.

---

## Step 1: Create Folders (1 minute)

Open your terminal and run:

```bash
# Replace 'your-bucket-name' with your actual GCS bucket name
export BUCKET="your-bucket-name"

# Create all required folders
gsutil -m mkdir \
  gs://$BUCKET/catalogs/ \
  gs://$BUCKET/pricelists/ \
  gs://$BUCKET/technical_docs/ \
  gs://$BUCKET/product_images/
```

---

## Step 2: Upload Your First Documents (2 minutes)

### Upload a Catalog:
```bash
gsutil cp your-catalog.pdf gs://$BUCKET/catalogs/catalog_2025.pdf
```

### Upload a Price List:
```bash
gsutil cp your-pricelist.pdf gs://$BUCKET/pricelists/pricelist_2025.pdf
```

### Upload Technical Docs (use product code in filename):
```bash
# For NFF 8x80
gsutil cp nff_8x80_specs.pdf gs://$BUCKET/technical_docs/NFF_8x80_specs.pdf

# For NFF 10x100
gsutil cp nff_10x100_specs.pdf gs://$BUCKET/technical_docs/NFF_10x100_specs.pdf
```

### Upload Product Images (use product code in filename):
```bash
# For NFF 8x80
gsutil cp nff_8x80_image1.jpg gs://$BUCKET/product_images/NFF_8x80_01.jpg
gsutil cp nff_8x80_image2.jpg gs://$BUCKET/product_images/NFF_8x80_02.jpg

# For NFF 10x100
gsutil cp nff_10x100_image1.jpg gs://$BUCKET/product_images/NFF_10x100_01.jpg
```

---

## Step 3: Test It! (2 minutes)

### Test 1: Request Catalog
Send this to your WhatsApp bot:
```
send me the catalog
```

Expected response:
```
📘 *Product Catalog*

Here's our latest catalog:
https://storage.googleapis.com/...

_Link expires in 60 minutes_
```

### Test 2: Request Price List
```
latest price list
```

Expected response:
```
💰 *Price List*

Here's our latest price list:
https://storage.googleapis.com/...
```

### Test 3: Request Technical Docs
```
technical specs for NFF 8x80
```

Expected response:
```
📋 *Technical Documentation for NFF 8x80*

1. NFF_8x80_specs.pdf
https://storage.googleapis.com/...
```

### Test 4: Request Product Images
```
show images of NFF 8x80
```

Expected response:
```
📸 *Product Images for NFF 8x80*

Image 1:
https://storage.googleapis.com/...

Image 2:
https://storage.googleapis.com/...
```

---

## 📝 File Naming Rules

**IMPORTANT:** For product-specific documents to work automatically, follow these naming conventions:

### Technical Documents:
✅ `NFF_8x80_specs.pdf`
✅ `NFF_10x100_technical.pdf`
✅ `8x80_datasheet.pdf`

❌ `specifications.pdf` (no product code)
❌ `tech doc.pdf` (no product code)

### Product Images:
✅ `NFF_8x80_01.jpg`
✅ `NFF_8x80_02.jpg`
✅ `10x100_front.jpg`

❌ `image1.jpg` (no product code)
❌ `photo.jpg` (no product code)

### Catalogs & Price Lists:
✅ Any filename works (system returns the latest)
✅ Recommended: Include date in name
   - `catalog_2025.pdf`
   - `pricelist_january_2025.pdf`

---

## 🚨 Troubleshooting

### "No catalog available"
**Problem:** No files in `catalogs/` folder
**Solution:**
```bash
gsutil ls gs://$BUCKET/catalogs/
# If empty:
gsutil cp your-catalog.pdf gs://$BUCKET/catalogs/
```

### "No technical documentation found"
**Problem:** Filename doesn't contain product code
**Solution:** Rename file to include product code:
```bash
# Wrong: specs.pdf
# Right:
gsutil cp specs.pdf gs://$BUCKET/technical_docs/NFF_8x80_specs.pdf
```

### "GCS not configured"
**Problem:** Environment variables not set
**Solution:** Check `app.yaml` has:
```yaml
env_variables:
  GOOGLE_CLOUD_STORAGE_BUCKET: "your-bucket-name"
  GOOGLE_APPLICATION_CREDENTIALS: "path/to/service-account.json"
```

### Link doesn't work / Access denied
**Problem:** Permissions issue
**Solution:** Make bucket publicly readable:
```bash
gsutil iam ch allUsers:objectViewer gs://$BUCKET
```
Or the system will automatically generate signed URLs.

---

## 🎯 Supported Customer Requests

Your AI bot automatically understands these requests:

### Catalogs:
- "send catalog"
- "show me catalog"
- "do you have a catalog?"
- "catalog bhejo"
- "product list"

### Price Lists:
- "send price list"
- "latest prices"
- "rate list"
- "price sheet"

### Technical Docs:
- "technical specs for 8x80"
- "product specifications"
- "datasheet for NFF 10x100"
- "8x80 ki technical details"

### Product Images:
- "show images of 8x80"
- "product photos"
- "picture bhejo"
- "10x100 ki photo"
- "how does it look"

---

## 📊 What You Get

After setup, customers can:

✅ Request product catalogs instantly
✅ Get latest price lists on demand
✅ View technical specifications
✅ See product images
✅ Upload product images for AI recognition
✅ Get automatic price quotes

All without you having to manually send files! 🎉

---

## 🔗 Need More Help?

- **Full Setup Guide:** [DOCUMENT_RETRIEVAL_SETUP.md](DOCUMENT_RETRIEVAL_SETUP.md)
- **Testing Guide:** [FEATURE_TESTING_GUIDE.md](FEATURE_TESTING_GUIDE.md)
- **Implementation Details:** [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)

---

## 📞 Support Commands

```bash
# List all your documents
gsutil ls -r gs://$BUCKET/

# Check specific folder
gsutil ls gs://$BUCKET/catalogs/

# View recent document requests in logs
gcloud app logs read --limit=50 | grep DOC_REQUEST

# Test GCS access
gsutil ls gs://$BUCKET/
```

---

**That's it! Start uploading and testing.** 🚀

Your bot is already live and ready to serve documents to customers.

*Deployed Version: auto-deploy-20251022-231037*
