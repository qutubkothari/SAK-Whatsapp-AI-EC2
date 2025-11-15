#!/usr/bin/env node
/**
 * Script: check_database_imports.js
 * Scans all JS files in the project for require('.../config/database') imports
 * Reports incorrect relative paths based on file location
 */
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = process.cwd();
const TARGET_IMPORT = 'config/database';
const IGNORED_DIRS = ['node_modules', '.git', 'dist', 'build'];

function getAllJSFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (IGNORED_DIRS.some(d => filePath.includes(d))) return;
        if (stat.isDirectory()) {
            results = results.concat(getAllJSFiles(filePath));
        } else if (file.endsWith('.js')) {
            results.push(filePath);
        }
    });
    return results;
}

function getCorrectImportPath(filePath) {
    // Get relative path from file to config/database.js
    const fileDir = path.dirname(filePath);
    const configPath = path.join(PROJECT_ROOT, 'config', 'database.js');
    let relPath = path.relative(fileDir, configPath);
    // Remove .js extension for require
    relPath = relPath.replace(/\\/g, '/').replace(/\.js$/, '');
    if (!relPath.startsWith('.')) relPath = './' + relPath;
    return relPath;
}

function checkImports() {
    const jsFiles = getAllJSFiles(PROJECT_ROOT);
    let issues = [];
    jsFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
    const regex = /require\(['"](\.\/config\/database)['"]\)/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
            const importPath = match[1];
            const correctPath = getCorrectImportPath(file);
            if (importPath !== correctPath) {
                issues.push({
                    file,
                    found: importPath,
                    expected: correctPath
                });
            }
        }
    });
    if (issues.length === 0) {
        console.log('✅ All config/database imports are correct!');
    } else {
        console.log(`⚠️  Found ${issues.length} incorrect imports:`);
        issues.forEach(issue => {
            console.log(`File: ${issue.file}`);
            console.log(`   Found:    require('${issue.found}')`);
            console.log(`   Expected: require('${issue.expected}')`);
        });
    }
}

checkImports();
