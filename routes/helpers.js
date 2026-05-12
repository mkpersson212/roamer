'use strict';

// Guards routes that should only be reached when NOT logged in (e.g. login/register pages).
// Takes req and res; redirects to home if a session exists and returns true, otherwise returns false.
exports.isLoggedIn = (req, res) => {
  if (req.session.currentUser) {
    res.redirect(303, '/');
    return true;
  }
  return false;
};

// Guards routes that require authentication.
// Takes req and res; sets a danger flash and redirects to login if no session exists, returning true; otherwise returns false.
exports.isNotLoggedIn = (req, res) => {
  if (!req.session.currentUser) {
    req.session.flash = { type: 'danger', intro: 'Access denied.', message: 'You must be logged in to do that.' };
    res.redirect(303, '/users/login');
    return true;
  }
  return false;
};
