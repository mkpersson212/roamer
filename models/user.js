'use strict';

const crypto = require('crypto');
const db = require('../database');

// Generates a random 16-byte salt for password hashing. Takes no arguments; returns a hex string.
const createSalt = () => crypto.randomBytes(16).toString('hex');

// Hashes a plaintext password with the given salt using PBKDF2-SHA256.
// Takes password (string) and salt (hex string); returns the hashed password as a hex string.
const encryptPassword = (password, salt) =>
  crypto.pbkdf2Sync(password, salt, 310000, 32, 'sha256').toString('hex');

// Inserts a new user, generating and storing a salt and hashed password before saving.
// Takes a user object (firstName, lastName, email, password); returns the inserted row as a camelized object.
exports.add = async (user) => {
  const salt = createSalt();
  const encryptedPassword = encryptPassword(user.password, salt);
  const { rows } = await db.getPool().query(
    'INSERT INTO users (first_name, last_name, email, password, salt) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [user.firstName, user.lastName, user.email, encryptedPassword, salt]
  );
  return db.camelize(rows)[0];
};

// Looks up a user by email address.
// Takes email (string); returns a camelized user object, or undefined if not found.
exports.getByEmail = async (email) => {
  const { rows } = await db.getPool().query(
    'SELECT * FROM users WHERE email = $1', [email]
  );
  return db.camelize(rows)[0];
};

// Looks up a user by their primary key.
// Takes id (user_id integer); returns a camelized user object, or undefined if not found.
exports.getById = async (id) => {
  const { rows } = await db.getPool().query(
    'SELECT * FROM users WHERE user_id = $1', [id]
  );
  return db.camelize(rows)[0];
};

// Validates login credentials by looking up the user and comparing hashed passwords.
// Takes a login object (email, password); returns the camelized user object on success, or null if not found or password is wrong.
exports.login = async (login) => {
  const user = await exports.getByEmail(login.email);
  if (!user) return null;
  const encrypted = encryptPassword(login.password, user.salt);
  return user.password === encrypted ? user : null;
};
