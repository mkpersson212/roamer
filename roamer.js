'use strict';

const express = require('express');
const expressHandlebars = require('express-handlebars');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const csrf = require('csurf');
const path = require('path');
const { credentials } = require('./config');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const amenitiesRouter = require('./routes/amenities');
const propertiesRouter = require('./routes/properties');
const propertyAvailabilityRouter = require('./routes/property_availability');

const app = express();

// View engine
const hbs = expressHandlebars.create({
  defaultLayout: 'main',
  helpers: {
    // Comparison helpers: take two values (a, b), return a boolean.
    eq:         (a, b) => a === b,
    ne:         (a, b) => a !== b,
    lt:         (a, b) => a < b,
    gt:         (a, b) => a > b,
    lte:        (a, b) => a <= b,
    gte:        (a, b) => a >= b,
    // Logical helpers: take two values (a, b), return a boolean.
    and:        (a, b) => a && b,
    or:         (a, b) => a || b,
    // Returns true if arr contains an item loosely equal to id.
    someId:     (arr, id) => arr && arr.some(item => item == id),
    // Returns true if arr strictly includes val.
    in:         (arr, val) => arr && arr.includes(val),
    // Takes a date value d, returns a locale-formatted date string or empty string.
    dateStr:    (d) => d ? new Date(d).toLocaleDateString() : '',
    // Takes an integer cents, returns a formatted dollar string like "$12.00" or "N/A".
    formatCents:(cents) => cents ? `$${(cents / 100).toFixed(2)}` : 'N/A',
    // Takes two numbers (a, b), returns a divided by b.
    divide:     (a, b) => a / b,
  },
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser(credentials.cookieSecret));
app.use(expressSession({
  resave: false,
  saveUninitialized: false,
  secret: credentials.cookieSecret,
}));
app.use(csrf({ cookie: false }));

// Make CSRF token and currentUser available to all views
// Runs on every request; takes req/res/next, returns nothing — calls next() to continue.
app.use((req, res, next) => {
  res.locals._csrfToken = req.csrfToken();
  res.locals.currentUser = req.session.currentUser;
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

// Routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/amenities', amenitiesRouter);
app.use('/property_availability', propertyAvailabilityRouter);
app.use('/properties', propertiesRouter);

// 404 handler — catches any request that didn't match a route above.
// Takes req/res, renders a 404 page with a danger flash. Returns nothing.
app.use((req, res) => {
  res.status(404).render('index', { title: 'Roamer || 404', flash: { type: 'danger', intro: '404', message: 'Page not found.' } });
});

// 500 handler — Express error middleware; called when next(err) is invoked anywhere.
// Takes err/req/res/next, logs the stack trace, and renders a 500 error page. Returns nothing.
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('index', { title: 'Roamer || Error', flash: { type: 'danger', intro: 'Error', message: err.message } });
});

const PORT = process.env.PORT || 3000;
// Starts the HTTP server on PORT. Callback takes no arguments; logs the URL when ready.
app.listen(PORT, () => console.log(`Roamer running on http://localhost:${PORT}`));
