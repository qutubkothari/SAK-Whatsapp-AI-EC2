// scripts/runOnboardingMigration.js
// Run this to add onboarding fields to customer_profiles table

const { supabase } = require('../services/config');

async function runMigration() {
    console.log('🔄 Starting onboarding migration...\n');

    try {
        // Check if columns exist by trying to select them
        console.log('1️⃣ Checking existing customer_profiles structure...');
        const { data: sample, error: checkError } = await supabase
            .from('customer_profiles')
            .select('id, first_name, onboarding_completed, onboarding_stage, address')
            .limit(1);

        if (!checkError) {
            console.log('✅ Onboarding columns already exist!');
            console.log('   Columns detected: onboarding_completed, onboarding_stage, address');
            
            // Update existing customers
            console.log('\n2️⃣ Marking existing customers as onboarded...');
            const { data: updated, error: updateError } = await supabase
                .from('customer_profiles')
                .update({
                    onboarding_completed: true,
                    onboarding_stage: 'completed'
                })
                .not('first_name', 'is', null)
                .is('onboarding_completed', null)
                .select('id');

            if (updateError) {
                console.error('❌ Error updating existing customers:', updateError.message);
            } else {
                console.log(`✅ Updated ${updated?.length || 0} existing customers`);
            }
            
            return;
        }

        console.log('⚠️  Onboarding columns do not exist yet.');
        console.log('\n📝 Please run these SQL commands in Supabase SQL Editor:\n');
        console.log('----------------------------------------');
        console.log('ALTER TABLE customer_profiles');
        console.log('ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,');
        console.log('ADD COLUMN IF NOT EXISTS onboarding_stage VARCHAR(50),');
        console.log('ADD COLUMN IF NOT EXISTS address TEXT;');
        console.log('');
        console.log('CREATE INDEX IF NOT EXISTS idx_customer_profiles_onboarding');
        console.log('ON customer_profiles(tenant_id, onboarding_completed);');
        console.log('');
        console.log('UPDATE customer_profiles');
        console.log('SET onboarding_completed = TRUE,');
        console.log('    onboarding_stage = \'completed\'');
        console.log('WHERE first_name IS NOT NULL');
        console.log('  AND (onboarding_completed IS NULL OR onboarding_completed = FALSE);');
        console.log('----------------------------------------\n');
        console.log('After running these commands, run this script again to verify.');
        
    } catch (error) {
        console.error('❌ Migration error:', error.message);
        console.error(error);
    }
}

runMigration()
    .then(() => {
        console.log('\n✨ Migration check complete!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Fatal error:', err);
        process.exit(1);
    });
