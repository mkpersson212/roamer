'use strict';

const db = require('../database');

exports.all = async () => {
  const { rows } = await db.getPool().query(
    'SELECT * FROM amenities ORDER BY amenity_name'
  );
  return db.camelize(rows);
};

exports.get = async (id) => {
  const { rows } = await db.getPool().query(
    'SELECT * FROM amenities WHERE amenity_id = $1', [id]
  );
  return db.camelize(rows)[0];
};

exports.add = async (amenity) => {
  const { rows } = await db.getPool().query(
    'INSERT INTO amenities (amenity_name) VALUES ($1) RETURNING *',
    [amenity.amenityName]
  );
  return db.camelize(rows)[0];
};

exports.update = async (amenity) => {
  const { rows } = await db.getPool().query(
    'UPDATE amenities SET amenity_name = $1 WHERE amenity_id = $2 RETURNING *',
    [amenity.amenityName, amenity.amenityId]
  );
  return db.camelize(rows)[0];
};

exports.upsert = async (amenity) => {
  if (amenity.amenityId) {
    return exports.update(amenity);
  }
  return exports.add(amenity);
};
