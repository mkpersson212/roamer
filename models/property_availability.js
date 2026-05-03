'use strict';

const db = require('../database');

exports.allForProperty = async (propertyId) => {
  const { rows } = await db.getPool().query(
    `SELECT * FROM property_availability
     WHERE property_id = $1
     ORDER BY start_date`,
    [propertyId]
  );
  return db.camelize(rows);
};

exports.add = async (availability) => {
  const { rows } = await db.getPool().query(
    `INSERT INTO property_availability (property_id, start_date, end_date, is_available)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [availability.propertyId, availability.startDate, availability.endDate, availability.isAvailable]
  );
  return db.camelize(rows)[0];
};

exports.remove = async (availabilityId) => {
  await db.getPool().query(
    'DELETE FROM property_availability WHERE availability_id = $1',
    [availabilityId]
  );
};
