#!/usr/bin/env node

const { existsSync } = require('fs');
const { cwd } = require('process');
const { join } = require('path');
const { getManifestVersion, getVersionWithoutPrerelease, setManifestVersion } = require('../lib/version');

// Get the version without prerelease identifier, e.g. "1.2.3-rc.4" -> "1.2.3"
const currentVersion = getManifestVersion(join(cwd(), 'package.json'));
const version = getVersionWithoutPrerelease(currentVersion);

console.log(version);

// update the versions in all locations provided on the command line
argv.slice(2).forEach(arg => {
    if (existsSync(arg)) {
        setManifestVersion(arg, version);
    }
});
