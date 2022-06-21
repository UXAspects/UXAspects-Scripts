#!/usr/bin/env node

const { program } = require('commander');
const { basename, dirname, resolve } = require('path');
const { env } = require('process');
const { package, packageForArtifactory, packageReleaseCandidate } = require('../lib/package');

program
    .argument('<directory>', 'directory to package')
    .option('--output <path>', 'path to output package')
    .option('--artifactory', 'copy to the directory structure for uploading to Artifactory')
    .option('--remove-scripts', 'remove the scripts from package.json');
program.parse();

const directory = program.args[0];
const { output, artifactory, removeScripts } = program.opts();

const outputDirectory = resolve(dirname(output));
const outputFileName = basename(output);

const opts = { removeScripts };

const packagePath = package(directory, { ...opts, outputDirectory, outputFileName });
console.log(`CREATED: ${packagePath}`);

if (artifactory) {
    const artifactoryPackagePath = packageForArtifactory(directory, opts);
    console.log(`CREATED: ${artifactoryPackagePath}`);
}

if (artifactory && env['RE_BUILD_TYPE'] === 'release') {
    const releaseCandidatePackagePath = packageReleaseCandidate(directory, opts);
    console.log(`CREATED: ${releaseCandidatePackagePath}`);
}
