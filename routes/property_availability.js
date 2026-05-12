'use strict';

const express = require('express');
const router = express.Router();
const PropertyAvailability = require('../models/property_availability');
const Property = require('../models/property');
const helpers = require('./helpers');

// POST /property_availability/add — inserts a new availability window for a property; requires login and ownership.
// Takes req (req.body: propertyId, startDate, endDate, isAvailable), res, next; redirects to the property detail page.
router.post('/add', async (req, res, next) => {
  if (helpers.isNotLoggedIn(req, res)) return;
  try {
    const property = await Property.get(req.body.propertyId);
    if (!property || property.hostId !== req.session.currentUser.userId) {
      req.session.flash = { type: 'danger', intro: 'Access denied.', message: 'You can only manage your own properties.' };
      return res.redirect(303, '/properties');
    }
    await PropertyAvailability.add({
      propertyId: req.body.propertyId,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      isAvailable: req.body.isAvailable === 'on',
    });
    req.session.flash = { type: 'success', intro: 'Saved!', message: 'Availability window added.' };
    res.redirect(303, `/properties/show/${req.body.propertyId}`);
  } catch (err) {
    next(err);
  }
});

// POST /property_availability/remove — deletes an availability window by ID; requires login and ownership.
// Takes req (req.body: availabilityId, propertyId), res, next; redirects to the property detail page.
router.post('/remove', async (req, res, next) => {
  if (helpers.isNotLoggedIn(req, res)) return;
  try {
    const property = await Property.get(req.body.propertyId);
    if (!property || property.hostId !== req.session.currentUser.userId) {
      req.session.flash = { type: 'danger', intro: 'Access denied.', message: 'You can only manage your own properties.' };
      return res.redirect(303, '/properties');
    }
    await PropertyAvailability.remove(req.body.availabilityId);
    req.session.flash = { type: 'success', intro: 'Removed.', message: 'Availability window deleted.' };
    res.redirect(303, `/properties/show/${req.body.propertyId}`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
