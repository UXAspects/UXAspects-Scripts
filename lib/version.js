const { readFileSync, writeFileSync } = require('fs');

module.exports = {
    getVersion: function(path) {
        // read file contents
        const content = readFileSync(path, 'utf8');

        // convert to a json structure
        const manifest = JSON.parse(content);

        return manifest.version;
    },

    setVersion: function(path, version) {
        // read file contents
        const content = readFileSync(path, 'utf8');

        // convert to a json structure
        const manifest = JSON.parse(content);

        // alter the version property
        manifest.version = version;

        // save the file
        writeFileSync(path, JSON.stringify(manifest, null, 2));
    }
};
