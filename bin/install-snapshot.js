#!/usr/bin/env node

const { execSync } = require('child_process');
const { readFileSync, writeFileSync } = require('fs');
const { argv, env } = require('process');
const { getVersionWithoutPrerelease } = require('@ux-aspects/ux-aspects-scripts/lib/version');

const snapshotRegistry = 'https://svsartifactory.swinfra.net/artifactory/api/npm/saas-npm-dev-local';

const packages = argv.slice(2);

if (env['RE_BUILD_TYPE'] === 'continuous') {

    const version = `${getVersionWithoutPrerelease(env['VERSION'])}-SNAPSHOT`;

    const execOptions = { stdio: [0, 1, 2] };

    // Temporarily switch to use Artifactory for @ux-aspects and @micro-focus packages only
    const originalConfig = getNpmConfig();
    const tempConfig = {
        ...originalConfig,
        '@ux-aspects:registry': snapshotRegistry,
        '@micro-focus:registry': snapshotRegistry
    };

    setNpmConfig(tempConfig);

    // Install snapshot packages
    for (const package of packages) {
        console.log(`Installing: ${package}@${version}`);
        execSync(`npm install ${package}@${version}`, execOptions);
    }

    // Revert temporary config
    setNpmConfig(originalConfig)
}

/** Return .npmrc as a key/value object. */
function getNpmConfig() {
    const config = {};
    try {
        const text = readFileSync('.npmrc', 'utf8');
        const lines = text.split('\n');
        lines.forEach(line => {
            const parts = line.split('=', 2);
            if (parts.length === 2) {
                config[parts[0]] = parts[1];
            }
        });
    }
    catch (error) {
        console.warn(error);
    }

    return config;
}

/** Write a set of key/values to .npmrc. */
function setNpmConfig(config) {
    const text = Object.keys(config).reduce((str, key) => str + `${key}=${config[key]}\n`, '');
    writeFileSync('.npmrc', text, { encoding: 'utf8' });
}
