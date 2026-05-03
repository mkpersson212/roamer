# CLAUDE.md — Roamer Development Guide

> **What this file is:** A complete context document for Claude Code to assist with building the Roamer application. It contains the project definition, database schema, architectural decisions, file structure, coding patterns, and a phased build plan. Read this fully before starting any task.

---

## 1. Project Overview

**Roamer** is a specialty property management and booking platform designed for digital nomads. Its core value proposition is eliminating "amenity uncertainty" — the gap between what a listing claims and what remote workers actually need (reliable high-speed internet, ergonomic workspaces, quiet environments, adequate power infrastructure).

Unlike general rental platforms, Roamer uses a relational database with a verified `property_amenities` junction table to make work-critical features **searchable and guaranteed**, not just described in free text.

**Stack:** Node.js, Express, Handlebars, PostgreSQL. Backend-focused; UI polish is not a priority.

---

## 2. Database Schema

### Canonical SQL (use this as the source of truth for `db.sql`)

```sql
DROP DATABASE IF EXISTS roamer;
CREATE DATABASE roamer;
\c roamer;

CREATE TABLE "users" (
  "user_id"       SERIAL PRIMARY KEY,
  "first_name"    VARCHAR(50),
  "last_name"     VARCHAR(50),
  "email"         VARCHAR(100) UNIQUE NOT NULL,
  "password"      VARCHAR,
  "salt"          VARCHAR
);

CREATE TABLE "properties" (
  "property_id"   SERIAL PRIMARY KEY,
  "host_id"       INT NOT NULL,
  "title"         VARCHAR(100),
  "city_location" VARCHAR(100),
  "nightly_rate"  INT,  -- stored in cents
  CONSTRAINT "FK_properties_host_id"
    FOREIGN KEY ("host_id") REFERENCES "users"("user_id")
);

CREATE TABLE "amenities" (
  "amenity_id"    SERIAL PRIMARY KEY,
  "amenity_name"  VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE "property_amenities" (
  "property_id"   INT NOT NULL,
  "amenity_id"    INT NOT NULL,
  PRIMARY KEY ("property_id", "amenity_id"),
  CONSTRAINT "FK_property_amenities_property_id"
    FOREIGN KEY ("property_id") REFERENCES "properties"("property_id"),
  CONSTRAINT "FK_property_amenities_amenity_id"
    FOREIGN KEY ("amenity_id") REFERENCES "amenities"("amenity_id")
);

CREATE TABLE "property_availability" (
  "availability_id" SERIAL PRIMARY KEY,
  "property_id"     INT NOT NULL,
  "start_date"      DATE,
  "end_date"        DATE,
  "is_available"    BOOLEAN DEFAULT TRUE,
  CONSTRAINT "FK_property_availability_property_id"
    FOREIGN KEY ("property_id") REFERENCES "properties"("property_id")
);

CREATE TABLE "bookings" (
  "booking_id"      SERIAL PRIMARY KEY,
  "property_id"     INT NOT NULL,
  "guest_id"        INT NOT NULL,
  "check_in_date"   DATE,
  "check_out_date"  DATE,
  "total_price"     INT,  -- stored in cents
  CONSTRAINT "FK_bookings_property_id"
    FOREIGN KEY ("property_id") REFERENCES "properties"("property_id"),
  CONSTRAINT "FK_bookings_guest_id"
    FOREIGN KEY ("guest_id") REFERENCES "users"("user_id")
);
```

### Schema notes
- `nightly_rate` and `total_price` are stored as integers in **cents** (e.g., $150/night = `15000`). Display logic divides by 100.
- `property_amenities` uses a **composite primary key** on `(property_id, amenity_id)` — no surrogate id needed since this is a pure junction table.
- `bookings` exists in the schema to demonstrate complete data model understanding, but booking routes/views are **out of scope for v1**.
- `property_availability` exists in the schema; v1 will only allow toggling a simple date range per property (no calendar UI).
- Any user can be a host (by creating a property) or a guest (by making a booking). There is **one user type**.

### Seed data file (`data.sql`)

Create a separate `data.sql` with:
- 5–8 amenities (e.g., `Dedicated Desk`, `Ergonomic Chair`, `High-Speed WiFi`, `Quiet Environment`, `Standing Desk`, `Multiple Monitors`, `Backup Power`, `Private Room`)
- 2–3 sample users
- 3–5 sample properties
- Several `property_amenities` rows linking properties to amenities

---

## 3. Application Architecture

Roamer follows the **exact same MVC pattern** as the BookedIn reference app (`info-638-spring-2025` on GitHub). If you are unsure how to structure anything, the BookedIn app is the reference implementation.

### File structure (target)

```
roamer/
├── roamer.js                  ← main entry point (equivalent to bookedin.js)
├── config.js
├── credentials.development.js ← gitignored, contains DB connection string + cookie secret
├── credentials.production.js  ← for Render.com, reads from process.env
├── database.js                ← pg pool + camelize utility (copy from BookedIn)
├── db.sql                     ← schema (CREATE TABLE statements)
├── data.sql                   ← seed data (INSERT statements)
├── package.json
├── .gitignore
│
├── models/
│   ├── user.js
│   ├── property.js
│   ├── amenity.js
│   ├── property_amenity.js
│   ├── property_availability.js
│   └── booking.js             ← schema only, no routes wired in v1
│
├── routes/
│   ├── index.js
│   ├── users.js
│   ├── properties.js
│   ├── amenities.js
│   ├── property_amenities.js
│   ├── property_availability.js
│   └── helpers.js
│
└── views/
    ├── index.handlebars
    ├── layouts/
    │   └── main.handlebars
    ├── users/
    │   ├── register.handlebars
    │   ├── login.handlebars
    │   └── profile.handlebars
    ├── properties/
    │   ├── index.handlebars
    │   ├── show.handlebars
    │   └── form.handlebars
    └── amenities/
        ├── index.handlebars
        └── form.handlebars
```

### `roamer.js` — dependencies to wire up (same as BookedIn)

```javascript
const express = require('express');
const expressHandlebars = require('express-handlebars');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const csrf = require('csurf');
const path = require('path');
const { credentials } = require('./config');

// Handlebars helpers (copy from BookedIn verbatim)
// eq, ne, lt, gt, lte, gte, and, or, someId, in, dateStr
```

### `database.js` — copy from BookedIn verbatim

The `database.js` file from the class repo handles connection pooling via `pg` and snake_case → camelCase conversion via lodash. Do not rewrite this — copy it directly.

---

## 4. Routing and Model Patterns

Every entity follows the same three-step pattern from BookedIn. Use async/await throughout.

### Model pattern

```javascript
// models/property.js
const db = require('../database');

exports.all = async () => {
  const { rows } = await db.getPool().query('SELECT * FROM properties ORDER BY property_id');
  return db.camelize(rows);
};

exports.get = async (id) => {
  const { rows } = await db.getPool().query(
    'SELECT * FROM properties WHERE property_id = $1', [id]
  );
  return db.camelize(rows)[0];
};

exports.add = async (property) => {
  const { rows } = await db.getPool().query(
    'INSERT INTO properties (host_id, title, city_location, nightly_rate) VALUES ($1, $2, $3, $4) RETURNING *',
    [property.hostId, property.title, property.cityLocation, property.nightlyRate]
  );
  return db.camelize(rows)[0];
};

exports.update = async (property) => {
  const { rows } = await db.getPool().query(
    'UPDATE properties SET title = $1, city_location = $2, nightly_rate = $3 WHERE property_id = $4 RETURNING *',
    [property.title, property.cityLocation, property.nightlyRate, property.propertyId]
  );
  return db.camelize(rows)[0];
};

exports.upsert = async (property) => {
  if (property.propertyId) {
    return exports.update(property);
  }
  return exports.add(property);
};
```

### Route pattern

```javascript
// routes/properties.js
const express = require('express');
const router = express.Router();
const Property = require('../models/property');
const helpers = require('./helpers');

// Index: list all properties
router.get('/', async (req, res, next) => {
  const properties = await Property.all();
  res.render('properties/index', { title: 'Roamer || Properties', properties });
});

// Show: single property detail
router.get('/show/:id', async (req, res, next) => {
  const property = await Property.get(req.params.id);
  res.render('properties/show', { title: `Roamer || ${property.title}`, property });
});

// Form: create/edit
router.get('/form', async (req, res, next) => {
  if (helpers.isNotLoggedIn(req, res)) return;
  const templateVars = { title: 'Roamer || New Property' };
  if (req.query.id) {
    const property = await Property.get(req.query.id);
    if (property) templateVars.property = property;
  }
  res.render('properties/form', templateVars);
});

// Upsert: POST from form
router.post('/upsert', async (req, res, next) => {
  if (helpers.isNotLoggedIn(req, res)) return;
  await Property.upsert(req.body);
  req.session.flash = { type: 'success', intro: 'Saved!', message: 'Property updated.' };
  res.redirect(303, '/properties');
});

module.exports = router;
```

### `routes/helpers.js` — auth guards

```javascript
// Copy from BookedIn. Two helpers:
exports.isLoggedIn = (req, res) => { /* redirect away if already logged in */ }
exports.isNotLoggedIn = (req, res) => { /* redirect to login if not logged in */ }
```

---

## 5. Key SQL Queries (for model files)

### Get all amenities for a property (for property show page)

```sql
SELECT amenities.*
FROM amenities
JOIN property_amenities ON amenities.amenity_id = property_amenities.amenity_id
WHERE property_amenities.property_id = $1
ORDER BY amenities.amenity_name;
```

### Get all properties with their host info (for index page)

```sql
SELECT properties.*, users.first_name, users.last_name
FROM properties
JOIN users ON properties.host_id = users.user_id
ORDER BY properties.property_id;
```

### Get all properties for a host (for user profile/dashboard)

```sql
SELECT * FROM properties WHERE host_id = $1 ORDER BY property_id;
```

### Add an amenity to a property (upsert pattern — ignore if already exists)

```sql
INSERT INTO property_amenities (property_id, amenity_id)
VALUES ($1, $2)
ON CONFLICT (property_id, amenity_id) DO NOTHING;
```

### Remove an amenity from a property

```sql
DELETE FROM property_amenities
WHERE property_id = $1 AND amenity_id = $2;
```

### Get availability windows for a property

```sql
SELECT * FROM property_availability
WHERE property_id = $1
ORDER BY start_date;
```

### Add/replace all amenities for a property (delete-then-insert pattern)

```javascript
// In property_amenity.js model:
exports.setForProperty = async (propertyId, amenityIds) => {
  await db.getPool().query('DELETE FROM property_amenities WHERE property_id = $1', [propertyId]);
  if (!amenityIds || amenityIds.length === 0) return;
  const ids = Array.isArray(amenityIds) ? amenityIds : [amenityIds];
  for (const amenityId of ids) {
    await db.getPool().query(
      'INSERT INTO property_amenities (property_id, amenity_id) VALUES ($1, $2)',
      [propertyId, amenityId]
    );
  }
};
```

---

## 6. Password Handling

Use the same `crypto` approach from BookedIn's `user.js`. Do not use bcrypt or any other library — keep it identical to what the class taught.

```javascript
const crypto = require('crypto');

const createSalt = () => crypto.randomBytes(16).toString('hex');

const encryptPassword = (password, salt) =>
  crypto.pbkdf2Sync(password, salt, 310000, 32, 'sha256').toString('hex');

exports.add = async (user) => {
  const salt = createSalt();
  const encryptedPassword = encryptPassword(user.password, salt);
  const { rows } = await db.getPool().query(
    'INSERT INTO users (first_name, last_name, email, password, salt) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [user.firstName, user.lastName, user.email, encryptedPassword, salt]
  );
  return db.camelize(rows)[0];
};

exports.login = async (login) => {
  const user = await exports.getByEmail(login.email);
  if (!user) return null;
  const encrypted = encryptPassword(login.password, user.salt);
  return user.password === encrypted ? user : null;
};
```

---

## 7. Displaying Prices

`nightly_rate` is stored as an integer in cents. Convert for display in Handlebars using a registered helper:

```javascript
// In roamer.js, add to handlebars helpers:
formatCents: (cents) => cents ? `$${(cents / 100).toFixed(2)}` : 'N/A'
```

Usage in templates: `{{formatCents property.nightlyRate}}`

---

## 8. User Session

Store the logged-in user on `req.session.currentUser` after login. Make it available to all views:

```javascript
// In roamer.js, after session setup:
app.use((req, res, next) => {
  res.locals.currentUser = req.session.currentUser;
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});
```

The `currentUser` object stored on the session should contain: `userId`, `firstName`, `lastName`, `email`. Do NOT store the hashed password or salt on the session.

---

## 9. Navigation Structure (`main.handlebars`)

```
Roamer (home) | Properties | Amenities (admin) | 
[if logged in: Welcome {name} | My Dashboard | Logout]
[if not logged in: Register | Login]
```

The user profile/dashboard page (`/users/profile`) shows:
- Properties the current user has listed (as host)
- Bookings the current user has made (as guest) — schema present, may be empty in v1

---

## 10. Build Plan (Phased)

Work through these phases **in order**. Do not skip ahead. Each phase should result in a working, runnable application before moving to the next.

---

### Phase 1 — Project Scaffold

**Goal:** A running Express app with no errors and a working homepage.

1. Create new GitHub repository named `roamer`
2. `npm init` with `name: "roamer"`, `version: "0.0.1"`, `private: true`
3. Install all dependencies:
   ```
   npm install express express-handlebars body-parser cookie-parser express-session csurf pg lodash bootstrap@5.3.3 nodemon
   ```
4. Create `.gitignore` (include `node_modules/`, `credentials.development.js`)
5. Create `roamer.js` — minimal Express app with:
   - Handlebars view engine with the helpers from BookedIn (copy verbatim)
   - body-parser, cookie-parser, express-session, CSRF wired up
   - Bootstrap static route
   - Flash message and currentUser middleware
   - 404 and 500 error handlers
6. Create `config.js` and `credentials.development.js` with `cookieSecret` and `postgres.connectionString`
7. Create `views/layouts/main.handlebars` with Bootstrap navbar and flash display
8. Create `views/index.handlebars` — simple welcome page
9. Create `routes/index.js` — serves homepage
10. Add `"start": "node ./roamer.js"` and `"dev": "nodemon ./roamer.js"` to `package.json` scripts
11. Run `npm run dev` and verify `http://localhost:3000` loads

**Commit:** `"Phase 1: project scaffold"`

---

### Phase 2 — Database

**Goal:** PostgreSQL database created and connected; app reads from it.

1. Create `db.sql` with the full schema (use the canonical SQL from Section 2 above)
2. Create `data.sql` with seed data (amenities, sample users, sample properties, property_amenities rows)
3. Run `db.sql` against your local PostgreSQL:
   ```
   psql -U postgres -f ./db.sql
   ```
4. Run `data.sql`:
   ```
   psql -U postgres -f ./data.sql
   ```
5. Verify all tables exist using `\dt` in psql
6. Create `database.js` (copy from BookedIn — `getPool()` and `camelize()`)
7. Update `credentials.development.js` with your local connection string:
   ```
   postgresql://postgres:<your_password>@localhost:5432/roamer
   ```
8. Test the DB connection by adding a quick query in `routes/index.js` (can be removed after)

**Commit:** `"Phase 2: database schema and connection"`

---

### Phase 3 — Users (Auth)

**Goal:** Users can register, log in, see their profile, and log out.

1. Create `models/user.js` with: `add`, `getByEmail`, `login`, `getById`
2. Create `routes/users.js` with:
   - `GET /users/register` + `POST /users/register`
   - `GET /users/login` + `POST /users/login`
   - `POST /users/logout`
   - `GET /users/profile` (requires login)
3. Create `views/users/register.handlebars`, `login.handlebars`, `profile.handlebars`
4. Create `routes/helpers.js` with `isLoggedIn` and `isNotLoggedIn`
5. Wire `usersRouter` in `roamer.js`
6. Update `main.handlebars` navbar with conditional login/logout/profile links
7. Test: register → log in → see name in nav → visit profile → log out

**Commit:** `"Phase 3: user auth (register, login, logout, profile)"`

---

### Phase 4 — Amenities (Admin CRUD)

**Goal:** Amenities can be viewed, created, and edited. This is simple — no junction table yet, just the `amenities` table.

1. Create `models/amenity.js` with: `all`, `get`, `add`, `update`, `upsert`
2. Create `routes/amenities.js` with:
   - `GET /amenities` (index)
   - `GET /amenities/form` + `POST /amenities/upsert`
3. Create `views/amenities/index.handlebars`, `form.handlebars`
4. Wire `amenitiesRouter` in `roamer.js`
5. Test: view amenity list → create new → edit existing

**Commit:** `"Phase 4: amenities CRUD"`

---

### Phase 5 — Properties (Core CRUD)

**Goal:** Properties can be listed, viewed, created, and edited. This is the heart of the application.

1. Create `models/property.js` with: `all`, `get`, `add`, `update`, `upsert`, `allForHost`

   Note: `allForHost` query joins on `users` to show host name, used on the profile page.

2. Create `routes/properties.js` with:
   - `GET /properties` (index — list all properties)
   - `GET /properties/show/:id` (detail page)
   - `GET /properties/form` + `POST /properties/upsert` (requires login)
3. Create views:
   - `properties/index.handlebars` — cards or list of all properties with city, title, nightly rate
   - `properties/show.handlebars` — title, city, rate, host name, amenities list (see Phase 6), availability (see Phase 7)
   - `properties/form.handlebars` — fields: title, city_location, nightly_rate (in dollars on the form, convert to cents before saving)
4. Wire `propertiesRouter` in `roamer.js`
5. Update `users/profile.handlebars` to show the logged-in user's listed properties using `allForHost`
6. Test: browse properties → view detail → create new (logged in) → edit existing

**Important:** `host_id` should be set automatically from `req.session.currentUser.userId` — do not expose it as a form field.

**Commit:** `"Phase 5: properties CRUD"`

---

### Phase 6 — Property Amenities (Junction Table)

**Goal:** Host can add/remove amenities on a property. Property detail page shows amenities.

1. Create `models/property_amenity.js` with:
   - `allForProperty(propertyId)` — returns amenity objects for a given property
   - `setForProperty(propertyId, amenityIds)` — delete-then-insert pattern (see Section 5)
2. Update `routes/properties.js`:
   - `GET /properties/show/:id` — add `amenities` to template vars using `allForProperty`
   - `GET /properties/form` — pass all amenities to the form (for the multi-select)
   - `POST /properties/upsert` — after saving property, call `setForProperty` with `req.body.amenityIds`
3. Update `properties/form.handlebars`:
   - Add a multi-select box for amenities (same pattern as BookedIn's `authorIds` multi-select)
   - Pre-select amenities that are already on the property when editing
4. Update `properties/show.handlebars`:
   - Display the amenities list (tags/pills or a simple `<ul>`)
5. Test: edit property → select amenities → save → verify on detail page

**Commit:** `"Phase 6: property amenities junction table"`

---

### Phase 7 — Property Availability (Simple Date Ranges)

**Goal:** Hosts can add availability windows to a property. Detail page shows when it's available.

1. Create `models/property_availability.js` with:
   - `allForProperty(propertyId)` — returns availability rows
   - `add(availability)` — insert a new date range
   - `remove(availabilityId)` — delete a row
2. Create `routes/property_availability.js` with:
   - `POST /property_availability/add` — add a date range (requires login, must own property)
   - `POST /property_availability/remove` — remove a date range (requires login, must own property)
3. Update `properties/show.handlebars`:
   - If the viewer is the property's host: show a small form to add a new date range (start_date, end_date, is_available checkbox)
   - Show a list of existing availability windows with a remove button on each
   - If not the host: just display the availability windows
4. Test: open own property → add availability → see it listed → remove it

**Commit:** `"Phase 7: property availability"`

---

### Phase 8 — Render.com Deployment (Extra Credit)

**Goal:** Application running publicly on Render.com.

1. Create `credentials.production.js`:
   ```javascript
   module.exports = {
     cookieSecret: process.env.COOKIESECRET,
     postgres: { connectionString: process.env.DBCONNECTIONSTRING }
   };
   ```
2. Commit this file (it is safe to commit — it contains no secrets, only `process.env` references)
3. On Render.com:
   - Create a new **PostgreSQL** database (free tier)
   - Copy the **External Database URL** and run `db.sql` and `data.sql` against it
   - Create a new **Web Service** connected to your GitHub repo
   - Build command: `npm install`
   - Start command: `node ./roamer.js`
   - Environment variables: `COOKIESECRET` (any random string), `DBCONNECTIONSTRING` (Internal Database URL from Render)
4. Verify the live URL works

**Commit:** `"Phase 8: production deployment config"`

---

## 11. What Is Out of Scope (v1)

These are intentionally excluded from v1. The schema supports them, but routes and views are not required:

- **Booking flow** — `bookings` table exists but no routes/views. Future v2 feature.
- **Search and filtering** — no search by city, availability, or amenities. The index page shows all properties.
- **Property deletion** — not required for the demo. Create/Read/Update is sufficient for v1.
- **User account editing** — profile is read-only; no password change or name update.

---

## 12. Coding Conventions

Follow these to stay consistent with the class style:

- Use `async/await` for all database calls — never `.then()` chains in routes or models
- Use `$1, $2, ...` parameterized queries — never string interpolation in SQL
- camelCase in JavaScript, snake_case in SQL column names (the `camelize` utility handles the conversion)
- Model functions handle all SQL — routes never query the database directly
- Routes handle all HTTP logic — models never touch `req` or `res`
- Always `await` before redirecting after a database write
- Flash messages: use `req.session.flash = { type: 'success'|'danger', intro: '...', message: '...' }`
- CSRF token: every POST form must include `<input type="hidden" name="_csrf" value="{{_csrfToken}}">`
- Redirect after POST: always use `res.redirect(303, '/path')`

---

## 13. Reference Files

- **BookedIn reference repo:** `https://github.com/rikvanmechelen/info-638-spring-2025`
- `database.js` — copy this file directly from the BookedIn repo, no changes needed
- `config.js` — copy and rename `bookedin` references to `roamer`
- Handlebars helpers block — copy the full `helpers` object from BookedIn's `bookedin.js` into `roamer.js`

---

## 14. Developer Notes

- **Work phase by phase** — resist the urge to jump ahead. Each phase ends with a working, testable application.
- **Commit after every phase** — you can always roll back to a working state this way.
- **The pattern repeats** — once you've done Users and Properties, Amenities will feel familiar. By Phase 6 you'll recognize the structure immediately.
- **nightly_rate in cents** — `15000` = $150.00. The form will let users type `150`, and the route converts it: `Math.round(parseFloat(req.body.nightlyRate) * 100)`.
- **The `host_id` field** — never expose this as a form field. Always populate it server-side from `req.session.currentUser.userId`.
- **CSRF errors** — if you get `ForbiddenError: invalid csrf token`, it almost always means you forgot the hidden `_csrf` input in a form, or you're POSTing via a link instead of a form button.
