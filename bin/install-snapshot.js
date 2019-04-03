#!/usr/bin/env node

const { execSync } = require('child_process');
const { readFileSync, writeFileSync } = require('fs');
const { argv, env } = require('process');
const { getVersionWithoutPrerelease } = require('../lib/version');

const snapshotRegistry = 'https://svsartifactory.swinfra.net/artifactory/api/npm/saas-npm-dev-local';

if (env['RE_BUILD_TYPE'] === 'continuous') {

    const packages = getNpmPackages(argv.slice(2));

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
        console.log(`Installing: ${package}`);
        execSync(`npm install ${package}`, execOptions);
    }

    // Revert temporary config
    setNpmConfig(originalConfig)
}


/**
 * Convert input args to an array of NPM package names with versions (`package@version`).
 * @param {string[]} args An array of either NPM package names, or the format `groupId:artifactId:npmPackageName`.
 */
function getNpmPackages(args) {

    // Get dependency info from official-build.props
    const versions = getDependenciesWithVersions();

    // Match args with version info from official-build.props
    return args.map(arg => {
        const pos = arg.lastIndexOf(':');
        const name = arg.substr(0, pos);
        const packageName = arg.substr(pos + 1);
        const version = versions[name] || `${getVersionWithoutPrerelease(env['VERSION'])}-SNAPSHOT`;
        return `${packageName}@${version}`;
    });
}

/** Extract artifact names and versions from official-build.props as key/value pairs. */
function getDependenciesWithVersions() {

    let result = {};
    try {
        const text = readFileSync('official-build.props', 'utf8');
        const matches = text.match(/^ADDITIONAL_DEPENDENCIES=(.+)$/m);
        if (matches.length >= 2) {
            const dependencies = matches[1].split(',');
            result = dependencies.reduce((acc, val) => {
                const pos = val.lastIndexOf(':');
                acc[val.substr(0, pos)] = val.substr(pos + 1);
                return acc;
            }, {});
        }
    }
    catch (error) {
        console.warn(error);
    }

    return result;
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
