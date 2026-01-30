#!/usr/bin/env node
/**
 * Build script for The Journey Plugin
 * Combines modular source files into a single main.js for Obsidian
 */

const fs = require('fs');
const path = require('path');

// BUILD ORDER - modules combined in sequence
const BUILD_ORDER = [
    'dev/src/constants.js',           // Configuration
    'dev/src/services/SkillService.js', // Skill logic
    'dev/src/views/JourneyView.js',     // UI code (4 tabs)
    'dev/main-core.js'                  // Everything else
];

function stripModuleExports(content) {
    // Remove module.exports and require() calls
    return content
        .replace(/module\.exports\s*=\s*\{[\s\S]*?\};?/g, '')
        .replace(/const\s+\{[^}]+\}\s*=\s*require\([^)]+\);?/g, '')
        .replace(/const\s+\w+\s*=\s*require\([^)]+\);?/g, '')
        .trim();
}

function build() {
    console.log('🔨 Building The Journey Plugin...\n');

    // Read Obsidian API require
    const header = `/* The Journey Plugin v0.5 - Beta Edition */
const { Plugin, ItemView, Notice, Modal, Setting, PluginSettingTab, requestUrl, MarkdownRenderer } = require('obsidian');

`;

    let combined = header;
    let filesProcessed = 0;

    for (const file of BUILD_ORDER) {
        const filePath = path.join(__dirname, '..', file);

        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  Skipping missing file: ${file}`);
            continue;
        }

        console.log(`📦 Adding: ${file}`);
        const content = fs.readFileSync(filePath, 'utf8');
        const cleaned = stripModuleExports(content);

        combined += `\n// ============================================================================\n`;
        combined += `// ${file.toUpperCase()}\n`;
        combined += `// ============================================================================\n\n`;
        combined += cleaned + '\n';

        filesProcessed++;
    }

    // Write output to root folder
    const outputPath = path.join(__dirname, '..', 'main.js');
    fs.writeFileSync(outputPath, combined, 'utf8');

    console.log(`\n✅ Build complete! Processed ${filesProcessed} files`);
    console.log(`📄 Output: main.js (${Math.round(combined.length / 1024)}KB)`);

    // Copy to plugin directory
    const pluginDir = '/Users/buihuyhung/AIProject/.obsidian/plugins/the-journey';

    // Create plugin directory if it doesn't exist
    if (!fs.existsSync(pluginDir)) {
        fs.mkdirSync(pluginDir, { recursive: true });
        console.log(`📁 Created plugin directory: ${pluginDir}`);
    }

    fs.copyFileSync(outputPath, path.join(pluginDir, 'main.js'));
    console.log(`📋 Copied to: ${pluginDir}/main.js`);

    // Also copy manifest.json and styles.css
    const rootDir = path.join(__dirname, '..');
    const manifestPath = path.join(rootDir, 'manifest.json');
    const stylesPath = path.join(rootDir, 'styles.css');

    if (fs.existsSync(manifestPath)) {
        fs.copyFileSync(manifestPath, path.join(pluginDir, 'manifest.json'));
        console.log(`📋 Copied manifest.json`);
    }

    if (fs.existsSync(stylesPath)) {
        fs.copyFileSync(stylesPath, path.join(pluginDir, 'styles.css'));
        console.log(`📋 Copied styles.css`);
    }
}

// Run build
try {
    build();
} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}
