'use strict';

const db = require('../database');

exports.all = async () => {
  const { rows } = await db.getPool().query(
    `SELECT properties.*, users.first_name, users.last_name
     FROM properties
     JOIN users ON properties.host_id = users.user_id
     ORDER BY properties.property_id`
  );
  return db.camelize(rows);
};

exports.get = async (id) => {
  const { rows } = await db.getPool().query(
    `SELECT properties.*, users.first_name, users.last_name
     FROM properties
     JOIN users ON properties.host_id = users.user_id
     WHERE properties.property_id = $1`,
    [id]
  );
  return db.camelize(rows)[0];
};

exports.allForHost = async (hostId) => {
  const { rows } = await db.getPool().query(
    'SELECT * FROM properties WHERE host_id = $1 ORDER BY property_id',
    [hostId]
  );
  return db.camelize(rows);
};

exports.add = async (property) => {
  const { rows } = await db.getPool().query(
    `INSERT INTO properties (host_id, title, city_location, nightly_rate)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [property.hostId, property.title, property.cityLocation, property.nightlyRate]
  );
  return db.camelize(rows)[0];
};

exports.update = async (property) => {
  const { rows } = await db.getPool().query(
    `UPDATE properties
     SET title = $1, city_location = $2, nightly_rate = $3
     WHERE property_id = $4 RETURNING *`,
    [property.title, property.cityLocation, property.nightlyRate, property.propertyId]
  );
  return db.camelize(rows)[0];
};

exports.upsert = async (property) => {
  if (property.propertyId) {
    return exports.update(property);
  }
  return exports.add(property);
};
