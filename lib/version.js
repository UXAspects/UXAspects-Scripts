const { readFile, readFileSync, writeFileSync } = require('fs');
const { major, minor, patch } = require('semver');
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

function getVersionWithoutPrerelease(version) {
    return `${major(version)}.${minor(version)}.${patch(version)}`;
}

module.exports = {
    getVersion: getManifestVersion,
    getManifestVersion: getManifestVersion,
    setVersion: setManifestVersion,
    setManifestVersion: setManifestVersion,
    getPomVersion: getPomVersion,
    getVersionWithoutPrerelease: getVersionWithoutPrerelease
};
