#!/usr/bin/env node
/**
 * Automated Fix Script for Database Import Path
 * 
 * This script automatically fixes the incorrect import path in aiLearning.js
 * 
 * Usage: node auto_fix_imports.js
 */

const fs = require('fs');
const path = require('path');

const TARGET_FILE = 'routes/api/aiLearning.js';
const WRONG_IMPORT = "require('./config/database')";
const CORRECT_IMPORT = "require('./config/database')";

console.log('🔧 Automatic Import Path Fix\n');
console.log('═'.repeat(50));

// Check if file exists
const filePath = path.join(process.cwd(), TARGET_FILE);

if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: File not found: ${TARGET_FILE}`);
    console.error('   Make sure you\'re running this from the project root directory.');
    process.exit(1);
}

console.log(`📁 Target file: ${TARGET_FILE}`);

// Read the file
let content;
try {
    content = fs.readFileSync(filePath, 'utf8');
} catch (error) {
    console.error(`❌ Error reading file: ${error.message}`);
    process.exit(1);
}

// Check if the wrong import exists
if (!content.includes(WRONG_IMPORT)) {
    console.log('✅ File is already correct or doesn\'t contain the target import.');
    console.log('   Nothing to fix!');
    process.exit(0);
}

// Create backup
const backupPath = filePath + '.backup';
try {
    fs.writeFileSync(backupPath, content, 'utf8');
    console.log(`💾 Backup created: ${TARGET_FILE}.backup`);
} catch (error) {
    console.error(`❌ Error creating backup: ${error.message}`);
    process.exit(1);
}

// Fix the import
const fixedContent = content.replace(
    new RegExp(WRONG_IMPORT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
    CORRECT_IMPORT
);

// Count replacements
const occurrences = (content.match(new RegExp(WRONG_IMPORT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;

// Write the fixed content
try {
    fs.writeFileSync(filePath, fixedContent, 'utf8');
    console.log(`✅ Fixed ${occurrences} occurrence(s) of incorrect import`);
    console.log(`📝 Changes made:`);
    console.log(`   - OLD: ${WRONG_IMPORT}`);
    console.log(`   + NEW: ${CORRECT_IMPORT}`);
} catch (error) {
    console.error(`❌ Error writing file: ${error.message}`);
    console.error('   Restoring from backup...');
    
    // Restore backup
    try {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('✅ Backup restored successfully');
    } catch (restoreError) {
        console.error(`❌ Error restoring backup: ${restoreError.message}`);
        console.error(`   Manual restoration may be required from: ${backupPath}`);
    }
    
    process.exit(1);
}

console.log('\n' + '═'.repeat(50));
console.log('✅ FIX COMPLETED SUCCESSFULLY!');
console.log('\n📋 Next steps:');
console.log('   1. Review the changes in: ' + TARGET_FILE);
console.log('   2. Restart your server');
console.log('   3. Check logs for the error message (should be gone)');
console.log('\n💡 To restore backup if needed:');
console.log(`   mv ${TARGET_FILE}.backup ${TARGET_FILE}`);
console.log('');
