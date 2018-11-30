#!/usr/bin/env node

const { env, cwd, exit } = require('process');
const { join } = require('path');
const { setVersion } = require('../lib/version');

const regex = /(\d+)\.(\d+)\.(\d+)\.(\d+)/;

// extract the version from the environment variable
const version = toSemVer(env.VERSION);

console.log(version);

// if there is no version specified then throw an error
if (!version) {
    throw new Error('Version has not been specified!');
}

// update the versions in all locations
setVersion(join(cwd(), 'package.json'), version);
setVersion(join(cwd(), 'package-lock.json'), version);
setVersion(join(cwd(), 'src', 'package.json'), version);

// end the script
exit();

function toSemVer(version) {
    const m = regex.exec(version);
    if (m) {
        return `${m[1]}.${m[2]}.${m[3]}+build.${m[4]}`;
    }

    return version;
}