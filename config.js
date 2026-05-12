'use strict';

let credentials;

// Checks for developer or production environment and uses appropriate credential file.
if (process.env.NODE_ENV === 'production') {
  credentials = require('./credentials.production');
} else {
  credentials = require('./credentials.development');
}

module.exports = { credentials };
