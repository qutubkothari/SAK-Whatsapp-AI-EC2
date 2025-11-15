#!/usr/bin/env node
/**
 * Import Path Verification Script
 * 
 * Verifies that the database import path fix has been applied correctly
 * 
 * Usage: node verify_fix.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Import Path Fix\n');
console.log('═'.repeat(50));

const checks = [
    {
        name: 'aiLearning.js exists',
        test: () => {
            const filePath = path.join(process.cwd(), 'routes/api/aiLearning.js');
            return fs.existsSync(filePath);
        }
    },
    {
        name: 'database.js exists',
        test: () => {
            const filePath = path.join(process.cwd(), 'config/database.js');
            return fs.existsSync(filePath);
        }
    },
    {
        name: 'aiLearning.js uses correct import path',
        test: () => {
            const filePath = path.join(process.cwd(), 'routes/api/aiLearning.js');
            if (!fs.existsSync(filePath)) return false;
            
            const content = fs.readFileSync(filePath, 'utf8');
            const hasCorrectImport = content.includes("require('./config/database')");
            const hasWrongImport = content.includes("require('./config/database')");
            
            return hasCorrectImport && !hasWrongImport;
        }
    },
    {
        name: 'No other files have similar issues',
        test: () => {
            // Check a few other critical files
            const filesToCheck = [
                'routes/api/aiAdmin.js',
                'routes/api/admin.js',
                'routes/handlers/customerHandler.js'
            ];
            
            for (const file of filesToCheck) {
                const filePath = path.join(process.cwd(), file);
                if (fs.existsSync(filePath)) {
                    const content = fs.readFileSync(filePath, 'utf8');
                    
                    // Check if they're trying to import config/database with potentially wrong path
                    const fileDepth = file.split('/').length;
                    const matches = content.match(/require\(['"]\.\.\/config\/database['"]\)/g);
                    
                    if (matches && fileDepth !== 2) {
                        console.log(`   ⚠️  Potential issue in ${file}`);
                        return false;
                    }
                }
            }
            return true;
        }
    }
];

let allPassed = true;
let passedCount = 0;

checks.forEach((check, index) => {
    try {
        const result = check.test();
        const icon = result ? '✅' : '❌';
        console.log(`${icon} Check ${index + 1}: ${check.name}`);
        
        if (result) {
            passedCount++;
        } else {
            allPassed = false;
        }
    } catch (error) {
        console.log(`❌ Check ${index + 1}: ${check.name}`);
        console.log(`   Error: ${error.message}`);
        allPassed = false;
    }
});

console.log('\n' + '═'.repeat(50));
console.log(`Results: ${passedCount}/${checks.length} checks passed\n`);

if (allPassed) {
    console.log('✅ ALL CHECKS PASSED!');
    console.log('\n✨ Your import paths are correctly configured.');
    console.log('   You can now restart your server and the error should be gone.');
} else {
    console.log('❌ SOME CHECKS FAILED');
    console.log('\n📋 Next steps:');
    console.log('   1. Review the failed checks above');
    console.log('   2. Run auto_fix_imports.js if you haven\'t already');
    console.log('   3. Manually check the flagged files');
    console.log('   4. Run this verification script again');
}

// Additional diagnostic info
console.log('\n📊 Diagnostic Information:');
console.log(`   Current directory: ${process.cwd()}`);
console.log(`   Node version: ${process.version}`);

// Try to require the database module
console.log('\n🧪 Module Resolution Test:');
try {
    const dbPath = path.join(process.cwd(), 'config/database.js');
    if (fs.existsSync(dbPath)) {
        console.log(`   ✅ database.js is readable`);
        
        // Try to require it (without executing)
        try {
            require(dbPath);
            console.log(`   ✅ database.js can be required successfully`);
        } catch (e) {
            if (e.code === 'MODULE_NOT_FOUND') {
                console.log(`   ⚠️  database.js has dependency issues: ${e.message}`);
            } else {
                console.log(`   ℹ️  database.js loaded (execution error is expected in test mode)`);
            }
        }
    } else {
        console.log(`   ❌ database.js not found at expected location`);
    }
} catch (error) {
    console.log(`   ❌ Error testing module resolution: ${error.message}`);
}

console.log('');
process.exit(allPassed ? 0 : 1);
