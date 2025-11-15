#!/usr/bin/env node
/**
 * Updated Automatic Import Path Fix
 * Fixes BOTH import errors in aiLearning.js
 * 
 * Usage: node auto_fix_imports_v2.js
 */

const fs = require('fs');
const path = require('path');

const TARGET_FILE = 'routes/api/aiLearning.js';

const FIXES = [
    {
        wrong: "require('../config/database')",
        correct: "require('../../config/database')",
        description: "config/database import"
    },
    {
        wrong: "require('../services/aiConversationContextService')",
        correct: "require('../../services/aiConversationContextService')",
        description: "aiConversationContextService import"
    }
];

console.log('🔧 Updated Automatic Import Path Fix\n');
console.log('═'.repeat(60));

// Check if file exists
const filePath = path.join(process.cwd(), TARGET_FILE);

if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: File not found: ${TARGET_FILE}`);
    console.error('   Make sure you\'re running this from the project root directory.');
    process.exit(1);
}

console.log(`📁 Target file: ${TARGET_FILE}\n`);

// Read the file
let content;
try {
    content = fs.readFileSync(filePath, 'utf8');
} catch (error) {
    console.error(`❌ Error reading file: ${error.message}`);
    process.exit(1);
}

// Check which fixes are needed
const neededFixes = FIXES.filter(fix => content.includes(fix.wrong));

if (neededFixes.length === 0) {
    console.log('✅ File is already correct!');
    console.log('   All import paths are properly configured.');
    process.exit(0);
}

console.log(`🔍 Found ${neededFixes.length} import(s) to fix:`);
neededFixes.forEach((fix, i) => {
    console.log(`   ${i + 1}. ${fix.description}`);
});
console.log('');

// Create backup
const backupPath = filePath + '.backup.' + Date.now();
try {
    fs.writeFileSync(backupPath, content, 'utf8');
    console.log(`💾 Backup created: ${path.basename(backupPath)}\n`);
} catch (error) {
    console.error(`❌ Error creating backup: ${error.message}`);
    process.exit(1);
}

// Apply all fixes
let fixedContent = content;
let totalReplacements = 0;

neededFixes.forEach(fix => {
    const regex = new RegExp(fix.wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const occurrences = (fixedContent.match(regex) || []).length;
    
    if (occurrences > 0) {
        fixedContent = fixedContent.replace(regex, fix.correct);
        totalReplacements += occurrences;
        console.log(`✅ Fixed: ${fix.description}`);
        console.log(`   - OLD: ${fix.wrong}`);
        console.log(`   + NEW: ${fix.correct}`);
        console.log(`   (${occurrences} occurrence${occurrences > 1 ? 's' : ''})\n`);
    }
});

// Write the fixed content
try {
    fs.writeFileSync(filePath, fixedContent, 'utf8');
    console.log('═'.repeat(60));
    console.log(`✅ SUCCESS! Fixed ${totalReplacements} import path(s)`);
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

console.log('\n📋 Next steps:');
console.log('   1. Review the changes in: ' + TARGET_FILE);
console.log('   2. Run verification: node verify_fix_v2.js');
console.log('   3. Restart your server');
console.log('   4. Check logs (errors should be gone)');
console.log('\n💡 To restore backup if needed:');
console.log(`   cp ${backupPath} ${TARGET_FILE}`);
console.log('');
