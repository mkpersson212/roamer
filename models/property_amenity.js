'use strict';

const db = require('../database');

// Fetches all amenities linked to a property, ordered alphabetically by name.
// Takes propertyId (integer); returns a camelized array of amenity objects.
exports.allForProperty = async (propertyId) => {
  const { rows } = await db.getPool().query(
    `SELECT amenities.*
     FROM amenities
     JOIN property_amenities ON amenities.amenity_id = property_amenities.amenity_id
     WHERE property_amenities.property_id = $1
     ORDER BY amenities.amenity_name`,
    [propertyId]
  );
  return db.camelize(rows);
};

// Replaces all amenities for a property using a delete-then-insert pattern.
// Takes propertyId (integer) and amenityIds (single ID or array); returns nothing.
exports.setForProperty = async (propertyId, amenityIds) => {
  await db.getPool().query(
    'DELETE FROM property_amenities WHERE property_id = $1', [propertyId]
  );
  if (!amenityIds || amenityIds.length === 0) return;
  const ids = Array.isArray(amenityIds) ? amenityIds : [amenityIds];
  for (const amenityId of ids) {
    await db.getPool().query(
      'INSERT INTO property_amenities (property_id, amenity_id) VALUES ($1, $2)',
      [propertyId, amenityId]
    );
  }
};
