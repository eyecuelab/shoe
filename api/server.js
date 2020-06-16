const fs = require('fs');
const Core = require('./core');

// Add plugins
const { manifest } = Core;

// Start server
const serverPromise = Core.start(manifest);
// serverPromise.then(() => {
fs.openSync('/tmp/app-initialized', 'w');
// });

module.exports = serverPromise;
