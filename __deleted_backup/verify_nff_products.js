// verify_nff_products.js
const { supabase } = require('./services/config');

async function verifyProducts() {
    const { data } = await supabase
        .from('products')
        .select('name, units_per_carton, packaging_unit, description')
        .ilike('name', 'NFF%')
        .order('name');
    
    console.table(data.map(p => ({
        name: p.name,
        units_per_carton: p.units_per_carton,
        packaging_unit: p.packaging_unit,
        desc: p.description?.substring(0, 50)
    })));
    
    process.exit(0);
}

verifyProducts();
