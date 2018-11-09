#!/usr/bin/env node

const { basename, join, cwd } = require('path');
const { createGzip, createGunzip } = require('zlib');
const { createReadStream, createWriteStream, mkdirpSync } = require('fs-extra');
const { extract, pack } = require('tar-stream');

const tarFile = process.argv[2];
const version = process.env.VERSION || process.argv[3];

const filenameRegex = /^([\w\-]*\w+)\-\d+\.\d+\.\d+/;

const gunzip = createGunzip();
const gzip = createGzip();
const tarExtract = extract();
const tarPack = pack();

const outputDir = cwd();
const outputFile = join(outputDir, getOutputFileName(basename(tarFile)));

mkdirpSync(outputDir);

const outputStream = createWriteStream(outputFile);

// Process entries in the tar stream
// Passthrough everything except package.json
tarExtract.on('entry', (header, stream, callback) => {
    if (header.name === 'package/package.json') {
        transformManifest(header, stream, callback);
    } else {
        stream.pipe(tarPack.entry(header, callback));
    }
});

// Finalize the output when the tar stream ends
tarExtract.on('finish', () => tarPack.finalize());

// Print the output file path on completion
outputStream.on('finish', () => console.log(outputFile));

// Stream the output via gzip to the output file
tarPack.pipe(gzip).pipe(outputStream);

// Stream the tar file via gzip to the extractor
createReadStream(tarFile).pipe(gunzip).pipe(tarExtract);


function getOutputFileName(inputFileName) {
    const match = inputFileName.match(filenameRegex);
    if (match) {
        return `${match[1]}-${version}.tgz`;
    }

    return inputFileName;
}

function transformManifest(header, stream, callback) {
    const chunks = [];

    // Accumulate the package.json data
    stream.on('data', chunk => chunks.push(chunk));

    stream.on('end', () => {
        // Update the version in package.json
        const buffer = updateManifestBuffer(Buffer.concat(chunks));

        // Update the header with the new file size
        header.size = buffer.length;

        // Push the updated data into the output tar stream
        tarPack.entry(header, buffer, callback);
    });
}

function updateManifestBuffer(buffer) {
    const manifest = JSON.parse(buffer.toString('utf8'));
    manifest.version = version;
    return Buffer.from(JSON.stringify(manifest, null, 2), 'utf8');
}