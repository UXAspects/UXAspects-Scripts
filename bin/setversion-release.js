#!/usr/bin/env node

const { existsSync } = require('fs');
const { cwd } = require('process');
const { join } = require('path');
const { major, minor, patch } = require('semver');
const { getVersion, setVersion } = require('../lib/version');

// Get the version without prerelease identifier, e.g. "1.2.3-rc.4" -> "1.2.3"
const currentVersion = getVersion(join(cwd(), 'package.json'));
const version = stripPrerelease(currentVersion);

console.log(version);

const libManifest = join(cwd(), 'dist', 'library', 'package.json');

// Update the version in the build manifest files
if (existsSync(libManifest)) {
    setVersion(libManifest, version);
} else {
    setVersion(join(cwd(), 'package.json'), version);
    setVersion(join(cwd(), 'dist', 'package.json'), version);
}



function stripPrerelease(v) {
    return `${major(v)}.${minor(v)}.${patch(v)}`;
}
