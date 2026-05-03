'use strict';

exports.isLoggedIn = (req, res) => {
  if (req.session.currentUser) {
    res.redirect(303, '/');
    return true;
  }
  return false;
};

exports.isNotLoggedIn = (req, res) => {
  if (!req.session.currentUser) {
    req.session.flash = { type: 'danger', intro: 'Access denied.', message: 'You must be logged in to do that.' };
    res.redirect(303, '/users/login');
    return true;
  }
  return false;
};
