'use strict';

const db = require('../database');

// Fetches all availability windows for a property, ordered by start_date.
// Takes propertyId (integer); returns a camelized array of availability objects.
exports.allForProperty = async (propertyId) => {
  const { rows } = await db.getPool().query(
    `SELECT * FROM property_availability
     WHERE property_id = $1
     ORDER BY start_date`,
    [propertyId]
  );
  return db.camelize(rows);
};

// Inserts a new availability window for a property.
// Takes an availability object (propertyId, startDate, endDate, isAvailable); returns the inserted row as a camelized object.
exports.add = async (availability) => {
  const { rows } = await db.getPool().query(
    `INSERT INTO property_availability (property_id, start_date, end_date, is_available)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [availability.propertyId, availability.startDate, availability.endDate, availability.isAvailable]
  );
  return db.camelize(rows)[0];
};

// Deletes an availability window by its primary key.
// Takes availabilityId (integer); returns nothing.
exports.remove = async (availabilityId) => {
  await db.getPool().query(
    'DELETE FROM property_availability WHERE availability_id = $1',
    [availabilityId]
  );
};
