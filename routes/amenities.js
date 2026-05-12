'use strict';

const express = require('express');
const router = express.Router();
const Amenity = require('../models/amenity');
const helpers = require('./helpers');

// GET /amenities — fetches all amenities and renders the index listing page.
// Takes req, res, next; returns nothing (renders amenities/index or calls next(err)).
router.get('/', async (req, res, next) => {
  try {
    const amenities = await Amenity.all();
    res.render('amenities/index', { title: 'Roamer || Amenities', amenities });
  } catch (err) {
    next(err);
  }
});

// GET /amenities/form — renders the create/edit form; requires login.
// Takes req (optional req.query.id for edit mode), res, next; renders amenities/form with the existing amenity pre-populated if editing.
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

// POST /amenities/upsert — creates or updates an amenity; requires login.
// Takes req (req.body with amenity fields), res, next; redirects to /amenities on success.
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
