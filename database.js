'use strict';

const _ = require('lodash');
const { credentials } = require('./config');

const pg = require('pg');
const connectionString = credentials.postgres.connectionString;
var pool;

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
  getPool: () => {
    if (pool) return pool;
    pool = new pg.Pool({ connectionString });
    return pool;
  },
  camelize: (rows) => {
    return rows.map(camelizeKeys);
  },
};
