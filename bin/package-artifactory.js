#!/usr/bin/env node

const { execSync } = require('child_process');
const { copySync, unlinkSync } = require('fs-extra');
const glob = require('glob');
const { basename, join } = require('path');
const { argv, env, cwd } = require('process');
const { getVersionWithoutPrerelease, setManifestVersion } = require('../lib/version');

const args = argv.slice(2);

// Package name, e.g. quantum-ux-aspects
const packageName = args[0];

// Package scope, e.g. micro-focus
const packageScope = args[1] || 'micro-focus';

// Subdirectory containing package.json, e.g. dist
const packageDir = args[2] || cwd();

// Get the package generated by `npm pack`
const package = getPackage(packageDir);

// Copy the package to target/artifactory
copyPackage(package, 'artifactory');

// Clean up the package
unlinkSync(package);

if (env['RE_BUILD_TYPE'] === 'release') {

    // For a release candidate build, get the version without the prerelease suffix
    const releaseVersion = getVersionWithoutPrerelease(env['VERSION']);

    // Update the manifest with the release version
    setManifestVersion(join(packageDir, 'package.json'), releaseVersion);

    // Pack again without rebuilding
    const releasePackage = createPackage(packageDir);
    console.log(releasePackage);

    // Copy the package to target/release-staging
    copyPackage(releasePackage, 'release-staging');

    // Clean up the package
    unlinkSync(releasePackage);
}


function getPackage(packageDir) {

    const srcFiles = glob.sync(`${packageScope}-${packageName}-*.*.*.tgz`, { cwd: packageDir });

    if (srcFiles.length === 0) {
        throw Error('No package file found.');
    }

    return join(packageDir, srcFiles[0]);
}

function createPackage(packageDir) {

    const execOptions = { cwd: packageDir, encoding: 'utf8' };

    const packageFile = execSync('npm pack --ignore-scripts --quiet', execOptions).trim();

    return join(packageDir, packageFile);
}

function copyPackage(src, releaseType) {

    // Build the Artifactory-format path
    const dest = join(cwd(), 'target', releaseType, `@${packageScope}`, packageName, '-', `@${packageScope}`, basename(src));

    console.debug(`copy ${src} -> ${dest}`);

    copySync(src, dest, { overwrite: true });
}