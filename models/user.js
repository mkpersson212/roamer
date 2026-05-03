'use strict';

const crypto = require('crypto');
const db = require('../database');

const createSalt = () => crypto.randomBytes(16).toString('hex');

const encryptPassword = (password, salt) =>
  crypto.pbkdf2Sync(password, salt, 310000, 32, 'sha256').toString('hex');

exports.add = async (user) => {
  const salt = createSalt();
  const encryptedPassword = encryptPassword(user.password, salt);
  const { rows } = await db.getPool().query(
    'INSERT INTO users (first_name, last_name, email, password, salt) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [user.firstName, user.lastName, user.email, encryptedPassword, salt]
  );
  return db.camelize(rows)[0];
};

exports.getByEmail = async (email) => {
  const { rows } = await db.getPool().query(
    'SELECT * FROM users WHERE email = $1', [email]
  );
  return db.camelize(rows)[0];
};

exports.getById = async (id) => {
  const { rows } = await db.getPool().query(
    'SELECT * FROM users WHERE user_id = $1', [id]
  );
  return db.camelize(rows)[0];
};

exports.login = async (login) => {
  const user = await exports.getByEmail(login.email);
  if (!user) return null;
  const encrypted = encryptPassword(login.password, user.salt);
  return user.password === encrypted ? user : null;
};
