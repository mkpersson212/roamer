'use strict';

const db = require('../database');

// Fetches all amenities ordered alphabetically by name.
// Takes no arguments; returns a camelized array of amenity objects.
exports.all = async () => {
  const { rows } = await db.getPool().query(
    'SELECT * FROM amenities ORDER BY amenity_name'
  );
  return db.camelize(rows);
};

// Fetches a single amenity by its primary key.
// Takes id (amenity_id integer); returns a camelized amenity object, or undefined if not found.
exports.get = async (id) => {
  const { rows } = await db.getPool().query(
    'SELECT * FROM amenities WHERE amenity_id = $1', [id]
  );
  return db.camelize(rows)[0];
};

// Inserts a new amenity into the database.
// Takes an amenity object (amenityName); returns the inserted row as a camelized object.
exports.add = async (amenity) => {
  const { rows } = await db.getPool().query(
    'INSERT INTO amenities (amenity_name) VALUES ($1) RETURNING *',
    [amenity.amenityName]
  );
  return db.camelize(rows)[0];
};

// Updates the name of an existing amenity.
// Takes an amenity object (amenityId, amenityName); returns the updated row as a camelized object.
exports.update = async (amenity) => {
  const { rows } = await db.getPool().query(
    'UPDATE amenities SET amenity_name = $1 WHERE amenity_id = $2 RETURNING *',
    [amenity.amenityName, amenity.amenityId]
  );
  return db.camelize(rows)[0];
};

// Creates or updates an amenity depending on whether amenityId is present.
// Takes an amenity object; returns the saved row as a camelized object.
exports.upsert = async (amenity) => {
  if (amenity.amenityId) {
    return exports.update(amenity);
  }
  return exports.add(amenity);
};
