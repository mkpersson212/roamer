'use strict';

let credentials;

if (process.env.NODE_ENV === 'production') {
  credentials = require('./credentials.production');
} else {
  credentials = require('./credentials.development');
}

module.exports = { credentials };
