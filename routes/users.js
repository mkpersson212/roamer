'use strict';

const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Property = require('../models/property');
const helpers = require('./helpers');

router.get('/register', (req, res) => {
  if (helpers.isLoggedIn(req, res)) return;
  res.render('users/register', { title: 'Roamer || Register' });
});

router.post('/register', async (req, res, next) => {
  if (helpers.isLoggedIn(req, res)) return;
  try {
    const existing = await User.getByEmail(req.body.email);
    if (existing) {
      req.session.flash = { type: 'danger', intro: 'Error.', message: 'An account with that email already exists.' };
      return res.redirect(303, '/users/register');
    }
    const user = await User.add({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password,
    });
    req.session.currentUser = {
      userId: user.userId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    };
    req.session.flash = { type: 'success', intro: 'Welcome!', message: `Account created for ${user.firstName}.` };
    res.redirect(303, '/');
  } catch (err) {
    next(err);
  }
});

router.get('/login', (req, res) => {
  if (helpers.isLoggedIn(req, res)) return;
  res.render('users/login', { title: 'Roamer || Login' });
});

router.post('/login', async (req, res, next) => {
  if (helpers.isLoggedIn(req, res)) return;
  try {
    const user = await User.login({ email: req.body.email, password: req.body.password });
    if (!user) {
      req.session.flash = { type: 'danger', intro: 'Login failed.', message: 'Invalid email or password.' };
      return res.redirect(303, '/users/login');
    }
    req.session.currentUser = {
      userId: user.userId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    };
    req.session.flash = { type: 'success', intro: 'Welcome back!', message: `Logged in as ${user.firstName}.` };
    res.redirect(303, '/');
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect(303, '/');
  });
});

router.get('/profile', async (req, res, next) => {
  if (helpers.isNotLoggedIn(req, res)) return;
  try {
    const properties = await Property.allForHost(req.session.currentUser.userId);
    res.render('users/profile', {
      title: 'Roamer || My Dashboard',
      properties,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
