'use strict';

const _ = require('lodash');
const { credentials } = require('./config');

const pg = require('pg');
const connectionString = credentials.postgres.connectionString;
var pool;

// Recursively converts all keys in obj from snake_case to camelCase.
// Takes any value (object, array, Date, or primitive); returns the same structure with camelCased keys.
const camelizeKeys = (obj) => {
  if (!_.isObject(obj)) {
    return obj;
  }
  if (_.isArray(obj)) {
    return obj.map(camelizeKeys);
  }
  if (obj instanceof Date) {
    return obj;
  }
  return _.mapValues(_.mapKeys(obj, (value, key) => _.camelCase(key)), (value, key) => {
    return _.isObject(value) || _.isArray(value) ? camelizeKeys(value) : value;
  });
};

module.exports = {
  // Returns the shared pg.Pool instance, creating it on first call. Takes no arguments.
  getPool: () => {
    if (pool) return pool;
    pool = new pg.Pool({ connectionString });
    return pool;
  },
  // Takes an array of DB row objects (rows) and returns a new array with all keys converted to camelCase.
  camelize: (rows) => {
    return rows.map(camelizeKeys);
  },
};
