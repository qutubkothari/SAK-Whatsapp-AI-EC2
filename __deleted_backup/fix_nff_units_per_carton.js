// fix_nff_units_per_carton.js
// Fix NFF products units_per_carton based on their descriptions

const { supabase } = require('./services/config');

async function fixNFFProductsUnitsPerCarton() {
    try {
        console.log('Fetching NFF products...');
        
        // Get all NFF products
        const { data: products, error } = await supabase
            .from('products')
            .select('id, name, description, units_per_carton, price')
            .ilike('name', 'NFF%')
            .order('name');

        if (error) {
            console.error('Error fetching products:', error);
            return;
        }

        console.log(`Found ${products.length} NFF products\n`);

        for (const product of products) {
            console.log(`\n${product.name}`);
            console.log(`  Description: ${product.description}`);
            console.log(`  Current units_per_carton: ${product.units_per_carton}`);
            console.log(`  Price: ₹${product.price}`);

            // Extract units from description
            // Format: "Box - 300 pcs x 10 Pkts" or "70 pcs x 10 Pkts"
            const match = product.description?.match(/(\d+)\s*pcs\s*x\s*(\d+)\s*Pkts/i);
            
            if (match) {
                const piecesPerPacket = parseInt(match[1]);
                const packetsPerCarton = parseInt(match[2]);
                const unitsPerCarton = piecesPerPacket * packetsPerCarton;

                console.log(`  Calculated units_per_carton: ${piecesPerPacket} × ${packetsPerCarton} = ${unitsPerCarton}`);

                if (product.units_per_carton !== unitsPerCarton) {
                    console.log(`  ⚠️  NEEDS UPDATE: ${product.units_per_carton} → ${unitsPerCarton}`);

                    // Update the product
                    const { error: updateError } = await supabase
                        .from('products')
                        .update({
                            units_per_carton: unitsPerCarton,
                            packets_per_carton: packetsPerCarton,
                            units_per_packet: piecesPerPacket,
                            packaging_unit: 'carton'  // Set to carton since we're selling by cartons
                        })
                        .eq('id', product.id);

                    if (updateError) {
                        console.error(`  ❌ Error updating: ${updateError.message}`);
                    } else {
                        console.log(`  ✅ Updated successfully`);
                    }
                } else {
                    console.log(`  ✓ Already correct`);
                }
            } else {
                console.log(`  ⚠️  Could not extract units from description`);
            }
        }

        console.log('\n\nDone!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixNFFProductsUnitsPerCarton();
