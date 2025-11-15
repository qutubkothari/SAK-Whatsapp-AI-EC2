# Product Category Management & Bulk Upload Guide

## Overview
This guide explains how to use the new product category management and bulk product upload features in your dashboard.

---

## 1. Database Setup

### Step 1: Run the Category Migration
Execute the SQL migration to create the categories table and add category_id to products:

```sql
-- Run this in your Supabase SQL Editor
-- File: migrations/add_product_categories.sql
```

This will:
- Create a `categories` table with tenant-specific category management
- Add a `category_id` column to the `products` table
- Create indexes for optimal performance
- Set up triggers for automatic timestamp updates

### Step 2: Add Sample Categories (Optional)
```sql
INSERT INTO categories (tenant_id, name, description) VALUES
    ('YOUR_TENANT_ID_HERE', 'NFF', 'NFF Category Products'),
    ('YOUR_TENANT_ID_HERE', 'Electronics', 'Electronic Products'),
    ('YOUR_TENANT_ID_HERE', 'Hardware', 'Hardware Products');
```

---

## 2. Using Category Management

### Adding/Editing Products with Categories

1. **Navigate to Products Tab** in your dashboard
2. **Click "Add Product"** or **Edit existing product**
3. **Select Category** from the dropdown
   - The dropdown is automatically populated from your categories table
   - Categories are tenant-specific

### Creating New Categories

Use the API endpoint:
```javascript
POST /api/categories
{
  "tenantId": "your-tenant-id",
  "name": "New Category",
  "description": "Category description"
}
```

Or directly in database:
```sql
INSERT INTO categories (tenant_id, name, description)
VALUES ('your-tenant-id', 'New Category', 'Description');
```

---

## 3. Bulk Product Upload

### Step 1: Prepare Your CSV File

**Required CSV Format:**
```csv
name,sku,price,stock,brand,category,packaging_unit,units_per_carton,image_url
Product A,SKU001,100.00,50,Brand X,NFF,Box,1000,https://example.com/image1.jpg
Product B,SKU002,200.00,30,Brand Y,Electronics,Carton,500,https://example.com/image2.jpg
```

**CSV Column Definitions:**
- `name` - Product name (required)
- `sku` - Stock Keeping Unit / Product code (required)
- `price` - Product price (required, numeric)
- `stock` - Stock quantity (required, integer)
- `brand` - Product brand (optional)
- `category` - Category name (must match existing category in database)
- `packaging_unit` - Unit of packaging (e.g., Box, Carton, Pallet)
- `units_per_carton` - Number of units per carton (integer)
- `image_url` - Product image URL (optional)

**Sample File:** See `sample_bulk_products.csv` in the project root

### Step 2: Upload Products via Dashboard

1. **Navigate to Products Tab**
2. **Click "Bulk Add Products"** button
3. **Select your CSV file**
4. **Click "Upload & Add"**
5. **Wait for confirmation** - You'll see a success message with the count of products added

### Step 3: Verify Upload

- Products will appear in the Products tab
- Each product will be linked to its category
- Categories not found in the database will result in `category_id = NULL`

---

## 4. API Endpoints

### Categories API

**GET /api/categories**
- Fetch all categories for a tenant
- Query param: `tenantId` or header `x-tenant-id`
- Response: `{ success: true, categories: [...] }`

**POST /api/categories**
- Create a new category
- Body: `{ tenantId, name, description }`
- Response: `{ success: true, category: {...} }`

### Bulk Upload API

**POST /api/products/bulk-upload**
- Upload CSV file with products
- Form data: `file` (CSV file), `tenantId`
- Response: `{ success: true, message: "...", count: 10 }`

---

## 5. Category-Based Discounts

Now that products have categories, you can create category-based discounts:

1. **Navigate to Discounts Tab**
2. **Create New Discount**
3. **Select Discount Type**: "Category"
4. **Choose Categories**: Select one or more categories
5. **Set Discount Value**: Percentage or fixed amount
6. **Save**

The discount will automatically apply to all products in the selected categories.

---

## 6. Troubleshooting

### Categories Not Loading in Dropdown
- Ensure the category migration has been run
- Check that categories exist in the database for your tenant
- Verify tenantId is being passed correctly

### Bulk Upload Fails
- **Check CSV format**: Ensure headers match exactly (case-sensitive)
- **Verify category names**: Categories must exist in database before upload
- **Check file size**: Large files may timeout (consider splitting)
- **Review console logs**: Check browser console for detailed error messages

### Category Mismatch
- If a product's category name doesn't match any existing category, `category_id` will be NULL
- Create categories first, then upload products
- Category names are case-sensitive (trim whitespace)

---

## 7. Best Practices

1. **Create Categories First**: Always create your category structure before bulk uploading products
2. **Consistent Naming**: Use consistent category names across your CSV files
3. **Test Small Batches**: Upload a small CSV file first to verify format
4. **Backup Data**: Export existing products before bulk operations
5. **Use SKU Codes**: Ensure unique SKU codes to prevent duplicates

---

## 8. Example Workflow

### Complete Setup Flow:

1. **Run Migration**
   ```sql
   -- Run migrations/add_product_categories.sql in Supabase
   ```

2. **Create Categories**
   ```sql
   INSERT INTO categories (tenant_id, name) VALUES
   ('your-tenant-id', 'NFF'),
   ('your-tenant-id', 'Electronics');
   ```

3. **Prepare CSV**
   ```csv
   name,sku,price,stock,brand,category,packaging_unit,units_per_carton,image_url
   Widget A,WID001,50,100,BrandX,NFF,Box,1000,
   Gadget B,GAD002,75,50,BrandY,Electronics,Carton,500,
   ```

4. **Upload via Dashboard**
   - Go to Products → Bulk Add Products
   - Select CSV file
   - Upload & Add

5. **Create Category Discount** (Optional)
   - Go to Discounts
   - Create new category-based discount
   - Select "NFF" category
   - Set 10% discount

---

## Support

If you encounter issues:
- Check deployment logs: `gcloud app logs read --limit=50`
- Review Supabase logs in the dashboard
- Verify database schema matches migration file
- Ensure npm packages are installed: `csv-parse`, `multer`

---

**Date Created:** October 27, 2025  
**Last Updated:** October 27, 2025
