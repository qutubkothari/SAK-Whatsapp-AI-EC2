# Quick Reference: Category & Bulk Upload

## 🚀 Quick Start (3 Steps)

### Step 1: Create Categories Table
```sql
-- Run in Supabase SQL Editor:
-- File: migrations/add_product_categories.sql
```

### Step 2: Add Your Categories
```sql
INSERT INTO categories (tenant_id, name) VALUES
('YOUR_TENANT_ID', 'NFF'),
('YOUR_TENANT_ID', 'Electronics');
```

### Step 3: Upload Products
1. Open dashboard → Products tab
2. Click "Bulk Add Products"
3. Upload your CSV file

---

## 📄 CSV Template

```csv
name,sku,price,stock,brand,category,packaging_unit,units_per_carton,image_url
Widget A,WID001,50.00,100,BrandX,NFF,Box,1000,https://example.com/img.jpg
```

**Download:** `sample_bulk_products.csv`

---

## 🔗 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/categories?tenantId=xxx` | List categories |
| POST | `/api/categories` | Create category |
| POST | `/api/products/bulk-upload` | Upload CSV |

---

## ✅ What's New

- ✨ Category dropdown in product modal
- 📤 Bulk product upload via CSV
- 🏷️ Category display on product cards
- 🎯 Category-based discount support

---

## 📚 Full Documentation

- **Complete Guide:** `PRODUCT_CATEGORY_BULK_UPLOAD_GUIDE.md`
- **Summary:** `CATEGORY_BULK_UPLOAD_SUMMARY.md`

---

## 🆘 Quick Troubleshooting

**Q: Categories not showing in dropdown?**  
A: Run the migration SQL file first

**Q: Bulk upload fails?**  
A: Check CSV format matches template exactly

**Q: Category shows as "N/A"?**  
A: Category name in CSV must match database exactly

---

**Dashboard URL:** https://sak-whatsapp-ai-sales-assist.wl.r.appspot.com
