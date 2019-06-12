const { readFile, readFileSync, writeFileSync } = require('fs');
const { major, minor, patch, prerelease } = require('semver');
const xml2js = require('xml2js');

function getManifestVersion(path) {
    // read file contents
    const content = readFileSync(path, 'utf8');

    // convert to a json structure
    const manifest = JSON.parse(content);

    return manifest.version;
}

function setManifestVersion(path, version) {
    // read file contents
    const content = readFileSync(path, 'utf8');

    // convert to a json structure
    const manifest = JSON.parse(content);

    // alter the version property
    manifest.version = version;

    // save the file
    writeFileSync(path, JSON.stringify(manifest, null, 2));
}

async function getPomVersion(path) {

    const parser = new xml2js.Parser();

    const promise = new Promise(function(resolve) {
        readFile(path, 'utf8', function(err, data) {
            parser.parseString(data, function(err, result) {
                const pomVersion = result['project']['version'][0];
                resolve(pomVersion);
            });
        });
    });

    return promise;
}

function getVersionForRelease(version) {

    // Remove any trailing -SNAPSHOT
    const v = version.replace('-SNAPSHOT', '');

    // Check the prerelease for alpha or beta - these can be released.
    const pre = prerelease(v);
    if ((pre[0] === 'alpha' || pre[0] === 'beta') && pre.length > 1) {
        return `${major(v)}.${minor(v)}.${patch(v)}-${pre[0]}.${pre[1]}`;
    }

    // Otherwise strip prerelease altogether
    return getVersionWithoutPrerelease(v);
}

function getVersionWithoutPrerelease(version) {
    return `${major(version)}.${minor(version)}.${patch(version)}`;
}

module.exports = {
    getVersion: getManifestVersion,
    getManifestVersion: getManifestVersion,
    setVersion: setManifestVersion,
    setManifestVersion: setManifestVersion,
    getPomVersion: getPomVersion,
    getVersionForRelease: getVersionForRelease,
    getVersionWithoutPrerelease: getVersionWithoutPrerelease
};
