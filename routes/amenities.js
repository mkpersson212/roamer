'use strict';

const express = require('express');
const router = express.Router();
const Amenity = require('../models/amenity');
const helpers = require('./helpers');

router.get('/', async (req, res, next) => {
  try {
    const amenities = await Amenity.all();
    res.render('amenities/index', { title: 'Roamer || Amenities', amenities });
  } catch (err) {
    next(err);
  }
});

router.get('/form', async (req, res, next) => {
  if (helpers.isNotLoggedIn(req, res)) return;
  try {
    const templateVars = { title: 'Roamer || Amenity' };
    if (req.query.id) {
      const amenity = await Amenity.get(req.query.id);
      if (amenity) templateVars.amenity = amenity;
    }
    res.render('amenities/form', templateVars);
  } catch (err) {
    next(err);
  }
});

router.post('/upsert', async (req, res, next) => {
  if (helpers.isNotLoggedIn(req, res)) return;
  try {
    await Amenity.upsert(req.body);
    req.session.flash = { type: 'success', intro: 'Saved!', message: 'Amenity updated.' };
    res.redirect(303, '/amenities');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
