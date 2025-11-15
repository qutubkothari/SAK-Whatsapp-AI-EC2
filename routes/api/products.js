const express = require('express');
const router = express.Router();
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const { supabase } = require('../../services/config');

// Configure multer for file upload (memory storage)
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/products/bulk-upload - bulk add products via CSV/Excel upload
router.post('/bulk-upload', upload.single('file'), async (req, res) => {
    try {
        const tenantId = req.body.tenantId || req.headers['x-tenant-id'];
        if (!tenantId) {
            return res.json({ success: false, error: 'Missing tenantId' });
        }

        if (!req.file) {
            return res.json({ success: false, error: 'No file uploaded' });
        }

        const ext = req.file.originalname.split('.').pop().toLowerCase();
        let products = [];

        // Parse CSV file
        if (ext === 'csv') {
            try {
                const fileContent = req.file.buffer.toString('utf-8');
                products = parse(fileContent, {
                    columns: true,
                    skip_empty_lines: true,
                    trim: true
                });
            } catch (parseError) {
                console.error('CSV parse error:', parseError);
                return res.json({ success: false, error: 'Failed to parse CSV file: ' + parseError.message });
            }
        } else if (ext === 'xlsx' || ext === 'xls') {
            // For Excel support, we'd need xlsx library
            return res.json({ success: false, error: 'Excel format not yet supported. Please use CSV format.' });
        } else {
            return res.json({ success: false, error: 'Unsupported file format. Please upload CSV.' });
        }

        if (products.length === 0) {
            return res.json({ success: false, error: 'No products found in file' });
        }

        // Fetch all categories for this tenant to map category names to IDs
        const { data: categories, error: catError } = await supabase
            .from('categories')
            .select('id, name')
            .eq('tenant_id', tenantId);

        if (catError) {
            console.error('Error fetching categories:', catError);
        }

        const categoryMap = {};
        if (categories) {
            categories.forEach(cat => {
                categoryMap[cat.name.toLowerCase().trim()] = cat.id;
            });
        }

        // Prepare product inserts
        const productsToInsert = products.map(p => {
            const categoryName = (p.category || '').toLowerCase().trim();
            const categoryId = categoryMap[categoryName] || null;

            return {
                tenant_id: tenantId,
                name: p.name || '',
                sku: p.sku || '',
                price: parseFloat(p.price) || 0,
                stock_quantity: parseInt(p.stock || p.stock_quantity) || 0,
                brand: p.brand || '',
                category_id: categoryId,
                packaging_unit: p.packaging_unit || '',
                units_per_carton: parseInt(p.units_per_carton) || 0,
                image_url: p.image_url || ''
            };
        });

        // Insert products in batches (Supabase handles this well)
        const { data: insertedProducts, error: insertError } = await supabase
            .from('products')
            .insert(productsToInsert)
            .select();

        if (insertError) {
            console.error('Error inserting products:', insertError);
            return res.json({ success: false, error: 'Failed to insert products: ' + insertError.message });
        }

        res.json({ 
            success: true, 
            message: `Successfully uploaded ${insertedProducts.length} products`,
            count: insertedProducts.length 
        });

    } catch (err) {
        console.error('Bulk upload error:', err);
        res.json({ success: false, error: err.message });
    }
});

module.exports = router;
