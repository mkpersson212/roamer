'use strict';

const db = require('../database');

// Fetches all properties joined with host first/last name, ordered by property_id.
// Takes no arguments; returns a camelized array of property objects.
exports.all = async () => {
  const { rows } = await db.getPool().query(
    `SELECT properties.*, users.first_name, users.last_name
     FROM properties
     JOIN users ON properties.host_id = users.user_id
     ORDER BY properties.property_id`
  );
  return db.camelize(rows);
};

// Fetches a single property by ID, joined with host first/last name.
// Takes id (property_id); returns a camelized property object, or undefined if not found.
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

// Fetches all properties belonging to a specific host, ordered by property_id.
// Takes hostId (user_id of the host); returns a camelized array of property objects.
exports.allForHost = async (hostId) => {
  const { rows } = await db.getPool().query(
    'SELECT * FROM properties WHERE host_id = $1 ORDER BY property_id',
    [hostId]
  );
  return db.camelize(rows);
};

// Inserts a new property row into the database.
// Takes a property object (hostId, title, cityLocation, nightlyRate); returns the inserted row as a camelized object.
exports.add = async (property) => {
  const { rows } = await db.getPool().query(
    `INSERT INTO properties (host_id, title, city_location, nightly_rate)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [property.hostId, property.title, property.cityLocation, property.nightlyRate]
  );
  return db.camelize(rows)[0];
};

// Updates title, city_location, and nightly_rate for an existing property.
// Takes a property object (propertyId, title, cityLocation, nightlyRate); returns the updated row as a camelized object.
exports.update = async (property) => {
  const { rows } = await db.getPool().query(
    `UPDATE properties
     SET title = $1, city_location = $2, nightly_rate = $3
     WHERE property_id = $4 RETURNING *`,
    [property.title, property.cityLocation, property.nightlyRate, property.propertyId]
  );
  return db.camelize(rows)[0];
};

// Creates or updates a property depending on whether propertyId is present.
// Takes a property object; returns the saved row as a camelized object.
exports.upsert = async (property) => {
  if (property.propertyId) {
    return exports.update(property);
  }
  return exports.add(property);
};
