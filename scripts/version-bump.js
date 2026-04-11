#!/usr/bin/env node
/**
 * Syncs version info from package.json into the native iOS and Android projects.
 *
 * Marketing version  →  package.json "version"   (bump manually with `npm version patch/minor/major`)
 * Build number       →  git commit count          (auto-increments with every commit, no state to manage)
 *
 * Run automatically via `npm run sync` before `cap sync`.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const buildNumber = execSync('git rev-list --count HEAD', { cwd: root }).toString().trim();

console.log(`Version: ${version}  Build: ${buildNumber}`);

// ── iOS: ios/App/App.xcodeproj/project.pbxproj ─────────────────────────────
const pbxprojPath = path.join(root, 'ios/App/App.xcodeproj/project.pbxproj');
let pbxproj = fs.readFileSync(pbxprojPath, 'utf8');
pbxproj = pbxproj.replace(/CURRENT_PROJECT_VERSION = \d+;/g,  `CURRENT_PROJECT_VERSION = ${buildNumber};`);
pbxproj = pbxproj.replace(/MARKETING_VERSION = [\d.]+;/g,     `MARKETING_VERSION = ${version};`);
fs.writeFileSync(pbxprojPath, pbxproj);
console.log('  ✓ iOS');

// ── Android: android/app/build.gradle ─────────────────────────────────────
const gradlePath = path.join(root, 'android/app/build.gradle');
let gradle = fs.readFileSync(gradlePath, 'utf8');
gradle = gradle.replace(/versionCode \d+/,          `versionCode ${buildNumber}`);
gradle = gradle.replace(/versionName "[\d.]+"/,     `versionName "${version}"`);
fs.writeFileSync(gradlePath, gradle);
console.log('  ✓ Android');
