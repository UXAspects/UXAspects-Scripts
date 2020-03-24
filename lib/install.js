const { execSync } = require('child_process');
const { existsSync, readFileSync, writeFileSync } = require('fs');
const { join } = require('path');
const { cwd, env } = require('process');
const { getVersionWithoutPrerelease } = require('../lib/version');

const execOptions = { stdio: [0, 1, 2] };

/**
 * Install an NPM package.
 * @param {string} package NPM package to install.
 */
function install(package) {
    console.log(`Installing: ${package}`);
    execSync(`npm install --save-dev ${package}`, execOptions);
}

/**
 * Execute a callback with a temporary NPM registry configured in the project.
 * @param {string} snapshotRegistry The URL of the temporary registry.
 * @param {() => void} callback Callback to execute while the temporary registry is configured.
 */
function useSnapshotRegistry(snapshotRegistry, callback) {

    // Temporarily switch to use Artifactory for @ux-aspects and @micro-focus packages only
    const originalConfig = getNpmConfig();
    const tempConfig = {
        ...originalConfig,
        '@ux-aspects:registry': snapshotRegistry,
        '@micro-focus:registry': snapshotRegistry
    };

    setNpmConfig(tempConfig);

    try {
        callback();
    }
    finally {
        // Revert temporary config
        setNpmConfig(originalConfig);
    }
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

        // If the package name contains an NPM version specifier, just return that
        if (packageName.indexOf('@', 1) > 0) {
            return packageName;
        }

        // Use the version mapped from official-build.props if available; otherwise the environment version.
        const version = versions[name] || `${getVersionWithoutPrerelease(env['VERSION'])}-SNAPSHOT`;
        return `${packageName}@${version}`;
    });
}

/** Extract artifact names and versions from official-build.props as key/value pairs. */
function getDependenciesWithVersions() {

    let result = {};
    try {
        const text = readFileSync(findFile('official-build.props'), 'utf8');
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


/**
 * Check for the named file in the current dir, proceeding through the parent hierarchy until it is found.
 * @param {string} name Name of the file.
 * @returns {string} Full path to the located file.
 */
function findFile(name) {
    let dir = cwd();
    while (!existsSync(join(dir, name))) {
        const prevDir = dir;
        dir = join(dir, '..');
        if (dir === prevDir) {
            throw new Error(`Could not find '${name}' in ${cwd()} or its parents.`);
        }
    }

    return join(dir, name);
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

module.exports = {
    install: install,
    useSnapshotRegistry: useSnapshotRegistry,
    getNpmPackages: getNpmPackages
};
