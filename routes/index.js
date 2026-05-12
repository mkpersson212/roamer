'use strict';

const express = require('express');
const router = express.Router();

// GET / — renders the home page. Takes req and res; returns nothing (renders the index view).
router.get('/', (req, res) => {
  res.render('index', { title: 'Roamer || Home' });
});

module.exports = router;
