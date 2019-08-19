#!/usr/bin/env node

const { argv, env, exit } = require('process');
const { existsSync } = require('fs-extra');
const { prerelease } = require('semver');
const { getPomVersion, getVersionForRelease, getVersionWithoutPrerelease, setManifestVersion } = require('../lib/version');

(async () => {

    // extract the version from the environment variable or pom.xml
    let version;
    if (env.VERSION) {
        version = getVersionForRelease(env.VERSION, env.VERSION_PRERELEASE);
        const buildPrerelease = prerelease(env.VERSION);
        if (buildPrerelease) {
            version += '-' + buildPrerelease.join('.');
        }
    } else {
        // Used in dev environment only
        version = getVersionWithoutPrerelease(await getPomVersion('pom.xml'));
    }

    console.log(version);

    // if there is no version specified then throw an error
    if (!version) {
        throw new Error('Version has not been specified!');
    }

    // update the versions in all locations provided on the command line
    argv.slice(2).forEach(arg => {
        if (existsSync(arg)) {
            setManifestVersion(arg, version);
        }
    });

    exit();

})().catch(err => console.error(err, err.stack));
