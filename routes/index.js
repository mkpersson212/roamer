'use strict';

const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', async (req, res) => {
  const { rows } = await db.getPool().query('SELECT COUNT(*) FROM amenities');
  console.log(`DB connected — amenities count: ${rows[0].count}`);
  res.render('index', { title: 'Roamer || Home' });
});

module.exports = router;
