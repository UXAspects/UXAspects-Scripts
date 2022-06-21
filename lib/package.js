const { execSync } = require('child_process');
const { renameSync, readFileSync, readJsonSync, writeFileSync, existsSync, unlinkSync, mkdirpSync } = require('fs-extra');
const { join, basename } = require('path');
const { env, cwd } = require('process');
const { getVersionForRelease } = require('./version');

/**
 * @typedef {Object} Options
 * @property {string} outputDirectory
 * @property {string} outputFileName
 * @property {string} customVersion
 * @property {boolean} removeScripts
 */

/**
 * Create an NPM package.
 * @param {string} directory directory to package
 * @param {Options} opts
 * @returns {string} path to the created package file
 */
function package(directory, opts) {
    const packager = new Packager(directory, opts);
    try {
        packager.prepare();
        return packager.package();
    } finally {
        packager.restore();
    }
}

module.exports.package = package;

/**
 * Create an NPM package in a directory suitable for uploading to Artifactory.
 * @param {string} directory directory to package
 * @param {Options} opts
 * @returns {string} path to the created package file
 */
function packageForArtifactory(directory, opts) {
    const outputDirectory = getArtifactoryPath(directory, false);

    return package(directory, { ...opts, outputDirectory });
}

module.exports.packageForArtifactory = packageForArtifactory;

/**
 * Create an NPM package in a directory suitable for uploading to Artifactory as a release candidate.
 * @param {string} directory directory to package
 * @param {Options} opts
 * @returns {string} path to the created package file
 */
function packageReleaseCandidate(directory, opts) {
    const outputDirectory = getArtifactoryPath(directory, true);
    const customVersion = getVersionForRelease(env['VERSION'], env['VERSION_PRERELEASE']);

    return package(directory, { ...opts, outputDirectory, customVersion });
}

module.exports.packageReleaseCandidate = packageReleaseCandidate;

class Packager {
    /**
     * @param {string} directory
     * @param {Options} opts
     */
    constructor(directory, opts) {
        this.directory = directory;
        this.outputDirectory = opts?.outputDirectory ?? directory;
        this.outputFileName = opts?.outputFileName;
        this.customVersion = opts?.customVersion;
        this.removeScripts = opts?.removeScripts;
        this.packageJsonPath = join(directory, 'package.json');
    }

    package() {
        const tempPackagePath = this.createPackage();
        const packagePath = this.movePackage(tempPackagePath);

        return packagePath;
    }

    prepare() {
        this.originalPackageJson = readFileSync(this.packageJsonPath, 'utf8');

        const packageJson = JSON.parse(this.originalPackageJson);
        let modified = false;

        if (this.removeScripts) {
            delete packageJson.scripts;
            modified = true;
        }

        if (this.customVersion) {
            packageJson.version = this.customVersion;
            modified = true;
        }

        if (modified) {
            writeFileSync(this.packageJsonPath, JSON.stringify(packageJson, null, 2));
        }
    }

    restore() {
        if (this.originalPackageJson) {
            writeFileSync(this.packageJsonPath, this.originalPackageJson);
        }
    }

    createPackage() {
        const execOptions = { cwd: this.directory, encoding: 'utf8' };
        const packageFile = execSync('npm pack --silent', execOptions).trim();

        return join(this.directory, packageFile);
    }

    movePackage(packagePath) {
        if (!existsSync(this.outputDirectory)) {
            mkdirpSync(this.outputDirectory);
        }

        const outputFileName = this.outputFileName ?? basename(packagePath);
        const outputFilePath = join(this.outputDirectory, outputFileName);

        if (existsSync(outputFilePath)) {
            unlinkSync(outputFilePath);
        }

        renameSync(packagePath, outputFilePath);

        return outputFilePath;
    }
}

function getArtifactoryPath(directory, isRelease) {
    const { scope, name } = getPackageName(directory);

    return join(cwd(), 'target', isRelease ? 'release-staging' : 'artifactory', scope, name, '-', scope);
}

function getPackageName(directory) {
    const packageJson = readJsonSync(join(directory, 'package.json'));
    const [scope, name] = packageJson.name.split('/');

    return { scope, name };
}
