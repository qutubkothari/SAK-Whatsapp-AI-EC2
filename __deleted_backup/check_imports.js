#!/usr/bin/env node
/**
 * Import Path Validator
 * Scans all JS files to find potential incorrect relative import paths
 */

const fs = require('fs');
const path = require('path');

// Files/folders to ignore
const IGNORE = [
    'node_modules',
    '.git',
    'dist',
    'build',
    '.DS_Store'
];

// Known valid imports from project root
const VALID_ROOT_IMPORTS = [
    'config/database',
    'services/',
    'routes/',
    'utils/',
    'middleware/',
    'controllers/',
    'commands/'
];

function getAllJSFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (IGNORE.some(ignore => filePath.includes(ignore))) {
            return;
        }
        
        if (stat.isDirectory()) {
            getAllJSFiles(filePath, fileList);
        } else if (file.endsWith('.js')) {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

function checkImportPaths(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const issues = [];
    
    lines.forEach((line, index) => {
        // Check for require statements
        const requireMatch = line.match(/require\(['"]([^'"]+)['"]\)/);
        if (requireMatch) {
            const importPath = requireMatch[1];
            
            // Check for potential issues
            if (importPath.startsWith('../')) {
                const depth = (importPath.match(/\.\.\//g) || []).length;
                const fileDepth = filePath.split(path.sep).length - 1;
                
                // Flag suspicious imports
                if (depth >= fileDepth) {
                    issues.push({
                        file: filePath,
                        line: index + 1,
                        code: line.trim(),
                        issue: `Import goes ${depth} levels up, but file is only ${fileDepth} levels deep`,
                        importPath
                    });
                }
                
                // Check if trying to import config/database
                if (importPath.includes('config/database')) {
                    const correctPath = '../'.repeat(fileDepth - 1) + 'config/database';
                    if (importPath !== correctPath) {
                        issues.push({
                            file: filePath,
                            line: index + 1,
                            code: line.trim(),
                            issue: `Incorrect path to config/database`,
                            importPath,
                            suggestion: correctPath
                        });
                    }
                }
            }
        }
    });
    
    return issues;
}

function main() {
    console.log('🔍 Scanning for import path issues...\n');
    
    const projectRoot = process.cwd();
    const jsFiles = getAllJSFiles(projectRoot);
    
    console.log(`Found ${jsFiles.length} JavaScript files\n`);
    
    let totalIssues = 0;
    const issuesByFile = {};
    
    jsFiles.forEach(file => {
        const issues = checkImportPaths(file);
        if (issues.length > 0) {
            issuesByFile[file] = issues;
            totalIssues += issues.length;
        }
    });
    
    if (totalIssues === 0) {
        console.log('✅ No import path issues found!');
        return;
    }
    
    console.log(`⚠️  Found ${totalIssues} potential issues:\n`);
    
    Object.entries(issuesByFile).forEach(([file, issues]) => {
        console.log(`📁 ${file}`);
        issues.forEach(issue => {
            console.log(`   Line ${issue.line}: ${issue.issue}`);
            console.log(`   Code: ${issue.code}`);
            if (issue.suggestion) {
                console.log(`   Suggestion: require('${issue.suggestion}')`);
            }
            console.log('');
        });
    });
}

main();
