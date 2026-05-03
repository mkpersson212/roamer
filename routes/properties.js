'use strict';

const express = require('express');
const router = express.Router();
const Property = require('../models/property');
const PropertyAmenity = require('../models/property_amenity');
const PropertyAvailability = require('../models/property_availability');
const Amenity = require('../models/amenity');
const helpers = require('./helpers');

router.get('/', async (req, res, next) => {
  try {
    const properties = await Property.all();
    res.render('properties/index', { title: 'Roamer || Properties', properties });
  } catch (err) {
    next(err);
  }
});

router.get('/show/:id', async (req, res, next) => {
  try {
    const property = await Property.get(req.params.id);
    if (!property) {
      req.session.flash = { type: 'danger', intro: 'Not found.', message: 'Property does not exist.' };
      return res.redirect(303, '/properties');
    }
    const [amenities, availability] = await Promise.all([
      PropertyAmenity.allForProperty(property.propertyId),
      PropertyAvailability.allForProperty(property.propertyId),
    ]);
    res.render('properties/show', { title: `Roamer || ${property.title}`, property, amenities, availability });
  } catch (err) {
    next(err);
  }
});

router.get('/form', async (req, res, next) => {
  if (helpers.isNotLoggedIn(req, res)) return;
  try {
    const templateVars = { title: 'Roamer || Property' };
    if (req.query.id) {
      const property = await Property.get(req.query.id);
      if (!property) {
        req.session.flash = { type: 'danger', intro: 'Not found.', message: 'Property does not exist.' };
        return res.redirect(303, '/properties');
      }
      if (property.hostId !== req.session.currentUser.userId) {
        req.session.flash = { type: 'danger', intro: 'Access denied.', message: 'You can only edit your own properties.' };
        return res.redirect(303, '/properties');
      }
      templateVars.property = property;
      templateVars.selectedAmenityIds = (await PropertyAmenity.allForProperty(property.propertyId)).map(a => a.amenityId);
    }
    templateVars.amenities = await Amenity.all();
    res.render('properties/form', templateVars);
  } catch (err) {
    next(err);
  }
});

router.post('/upsert', async (req, res, next) => {
  if (helpers.isNotLoggedIn(req, res)) return;
  try {
    const nightlyRate = Math.round(parseFloat(req.body.nightlyRate) * 100);
    if (req.body.propertyId) {
      const existing = await Property.get(req.body.propertyId);
      if (!existing || existing.hostId !== req.session.currentUser.userId) {
        req.session.flash = { type: 'danger', intro: 'Access denied.', message: 'You can only edit your own properties.' };
        return res.redirect(303, '/properties');
      }
    }
    const saved = await Property.upsert({
      propertyId: req.body.propertyId || null,
      hostId: req.session.currentUser.userId,
      title: req.body.title,
      cityLocation: req.body.cityLocation,
      nightlyRate,
    });
    await PropertyAmenity.setForProperty(saved.propertyId, req.body.amenityIds);
    req.session.flash = { type: 'success', intro: 'Saved!', message: 'Property updated.' };
    res.redirect(303, '/properties');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
