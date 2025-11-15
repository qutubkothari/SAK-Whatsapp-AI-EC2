#!/usr/bin/env node
/**
 * Complete Import Audit Script
 * Scans aiLearning.js for ALL potentially incorrect imports
 * 
 * Usage: node audit_all_imports.js
 */

const fs = require('fs');
const path = require('path');

const TARGET_FILE = 'routes/api/aiLearning.js';
const FILE_DEPTH = 2; // routes/api/ = 2 directories deep

console.log('🔍 Complete Import Audit\n');
console.log('═'.repeat(70));
console.log(`📁 Analyzing: ${TARGET_FILE}`);
console.log(`📊 File depth: ${FILE_DEPTH} levels\n`);

// Check if file exists
const filePath = path.join(process.cwd(), TARGET_FILE);

if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: File not found: ${TARGET_FILE}`);
    console.error('   Make sure you\'re running this from the project root directory.');
    process.exit(1);
}

// Read the file
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Analyze all require statements
const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
let match;
const imports = [];
let lineNumber = 1;

for (const line of lines) {
    requireRegex.lastIndex = 0;
    while ((match = requireRegex.exec(line)) !== null) {
        const importPath = match[1];
        imports.push({
            path: importPath,
            line: lineNumber,
            code: line.trim()
        });
    }
    lineNumber++;
}

console.log(`Found ${imports.length} require statement(s)\n`);
console.log('═'.repeat(70));

// Categorize imports
const issues = [];
const warnings = [];
const correct = [];

imports.forEach(imp => {
    const isRelative = imp.path.startsWith('../') || imp.path.startsWith('./');
    const upLevels = (imp.path.match(/\.\.\//g) || []).length;
    
    if (!isRelative) {
        // Absolute or node_modules import
        correct.push({ ...imp, status: 'npm/absolute' });
    } else if (imp.path.startsWith('./')) {
        // Same directory import
        correct.push({ ...imp, status: 'same directory' });
    } else if (upLevels === FILE_DEPTH) {
        // Correct depth for reaching project root
        correct.push({ ...imp, status: 'correct depth' });
    } else if (upLevels < FILE_DEPTH) {
        // Not going up enough levels - likely an error
        issues.push({
            ...imp,
            issue: 'Not enough ../ levels',
            suggestion: imp.path.replace(/^\.\.\//, '../../'),
            severity: 'ERROR'
        });
    } else {
        // Going up too many levels - might be intentional
        warnings.push({
            ...imp,
            issue: 'Going up more levels than file depth',
            severity: 'WARNING'
        });
    }
});

// Display results
console.log('\n❌ ERRORS (Must Fix):\n');
if (issues.length === 0) {
    console.log('   ✅ No errors found!\n');
} else {
    issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. Line ${issue.line}:`);
        console.log(`      Current:    require('${issue.path}')`);
        console.log(`      Should be:  require('${issue.suggestion}')`);
        console.log(`      Code: ${issue.code}`);
        console.log('');
    });
}

console.log('═'.repeat(70));
console.log('\n⚠️  WARNINGS (Review Recommended):\n');
if (warnings.length === 0) {
    console.log('   ✅ No warnings!\n');
} else {
    warnings.forEach((warning, i) => {
        console.log(`   ${i + 1}. Line ${warning.line}:`);
        console.log(`      ${warning.path}`);
        console.log(`      Issue: ${warning.issue}`);
        console.log(`      Code: ${warning.code}`);
        console.log('');
    });
}

console.log('═'.repeat(70));
console.log('\n✅ CORRECT IMPORTS:\n');
if (correct.length === 0) {
    console.log('   No imports found\n');
} else {
    // Group by type
    const grouped = correct.reduce((acc, imp) => {
        acc[imp.status] = acc[imp.status] || [];
        acc[imp.status].push(imp);
        return acc;
    }, {});

    Object.entries(grouped).forEach(([status, items]) => {
        console.log(`   ${status.toUpperCase()}: (${items.length})`);
        items.forEach(imp => {
            console.log(`      Line ${imp.line}: require('${imp.path}')`);
        });
        console.log('');
    });
}

console.log('═'.repeat(70));
console.log('\n📊 SUMMARY:\n');
console.log(`   Total imports:     ${imports.length}`);
console.log(`   ❌ Errors:         ${issues.length}`);
console.log(`   ⚠️  Warnings:       ${warnings.length}`);
console.log(`   ✅ Correct:        ${correct.length}\n`);

if (issues.length > 0) {
    console.log('═'.repeat(70));
    console.log('\n🔧 RECOMMENDED ACTIONS:\n');
    console.log('   1. Run: node auto_fix_imports_v2.js');
    console.log('   2. Review any warnings manually');
    console.log('   3. Run: node verify_fix_v2.js');
    console.log('   4. Restart server\n');
}

// Save detailed report
const reportPath = 'import_audit_report.txt';
const report = `
Import Audit Report
Generated: ${new Date().toISOString()}
File: ${TARGET_FILE}

ERRORS (${issues.length}):
${issues.map((issue, i) => `
${i + 1}. Line ${issue.line}
   Current: require('${issue.path}')
   Fix to:  require('${issue.suggestion}')
   Code: ${issue.code}
`).join('\n')}

WARNINGS (${warnings.length}):
${warnings.map((warning, i) => `
${i + 1}. Line ${warning.line}
   Path: ${warning.path}
   Issue: ${warning.issue}
   Code: ${warning.code}
`).join('\n')}

CORRECT IMPORTS (${correct.length}):
${correct.map(imp => `Line ${imp.line}: require('${imp.path}') [${imp.status}]`).join('\n')}
`;

try {
    fs.writeFileSync(reportPath, report, 'utf8');
    console.log(`   📄 Detailed report saved to: ${reportPath}\n`);
} catch (error) {
    console.log(`   ⚠️  Could not save report: ${error.message}\n`);
}

process.exit(issues.length > 0 ? 1 : 0);
