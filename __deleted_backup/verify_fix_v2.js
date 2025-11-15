#!/usr/bin/env node
/**
 * Verification script for auto_fix_imports_v2.js
 * Checks that all import paths in aiLearning.js are correct.
 * Usage: node verify_fix_v2.js
 */

const fs = require('fs');
const path = require('path');

const TARGET_FILE = 'routes/api/aiLearning.js';
const EXPECTED_IMPORTS = [
    "require('../../config/database')",
    "require('../../services/aiConversationContextService')"
];

console.log('🔎 Verifying import paths in', TARGET_FILE);
const filePath = path.join(process.cwd(), TARGET_FILE);

if (!fs.existsSync(filePath)) {
    console.error('❌ File not found:', TARGET_FILE);
    process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf8');
let allCorrect = true;
EXPECTED_IMPORTS.forEach(imp => {
    if (!content.includes(imp)) {
        console.error('❌ Missing or incorrect import:', imp);
        allCorrect = false;
    }
});

if (allCorrect) {
    console.log('✅ All import paths are correct!');
    process.exit(0);
} else {
    console.log('❌ Some import paths are incorrect. Please re-run the fix or check manually.');
    process.exit(1);
}
