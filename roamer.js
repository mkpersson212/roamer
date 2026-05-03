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

const app = express();

// View engine
const hbs = expressHandlebars.create({
  defaultLayout: 'main',
  helpers: {
    eq:         (a, b) => a === b,
    ne:         (a, b) => a !== b,
    lt:         (a, b) => a < b,
    gt:         (a, b) => a > b,
    lte:        (a, b) => a <= b,
    gte:        (a, b) => a >= b,
    and:        (a, b) => a && b,
    or:         (a, b) => a || b,
    someId:     (arr, id) => arr && arr.some(item => item == id),
    in:         (arr, val) => arr && arr.includes(val),
    dateStr:    (d) => d ? new Date(d).toLocaleDateString() : '',
    formatCents:(cents) => cents ? `$${(cents / 100).toFixed(2)}` : 'N/A',
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
app.use('/properties', propertiesRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).render('index', { title: 'Roamer || 404', flash: { type: 'danger', intro: '404', message: 'Page not found.' } });
});

// 500 handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('index', { title: 'Roamer || Error', flash: { type: 'danger', intro: 'Error', message: err.message } });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Roamer running on http://localhost:${PORT}`));
