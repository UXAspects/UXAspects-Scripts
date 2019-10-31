#!/usr/bin/env node

/**
 * Install one or more packages from the snapshot registry. It will install either the version specified on the command
 * line (if `package@version` format is provided), or the version specified in official-build.props
 * (if `groupId:artifactId:npmPackageName` format is provided).
 * Relevant environment variables:
 * - `RE_BUILD_TYPE` - build type from SEPG.
 * - `VERSION` - version from SEPG.
 */

const { argv, env } = require('process');
const { getNpmPackages, install, useSnapshotRegistry } = require('../lib/install');

const snapshotRegistry = 'https://svsartifactory.swinfra.net/artifactory/api/npm/saas-npm-dev-local';

if (!env['RE_BUILD_TYPE'] || env['RE_BUILD_TYPE'] === 'continuous') {

    const packages = getNpmPackages(argv.slice(2));

    // Install packages using the snapshot registry
    useSnapshotRegistry(snapshotRegistry, () => {
        for (const package of packages) {
            install(package);
        }
    });
}
