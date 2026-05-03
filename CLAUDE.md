# CLAUDE.md — Roamer Development Guide

**Roamer** is a property management platform for digital nomads. Stack: Node.js, Express, Handlebars, PostgreSQL. Backend-focused; UI polish is not a priority. Follows the BookedIn MVC pattern from `https://github.com/rikvanmechelen/info-638-spring-2025`.

**Status:** Phases 1–5 complete. Scaffold, database, auth, amenities CRUD, and properties CRUD are all working and committed.

---

## 1. Database Schema

```sql
CREATE TABLE "users" (
  "user_id" SERIAL PRIMARY KEY, "first_name" VARCHAR(50), "last_name" VARCHAR(50),
  "email" VARCHAR(100) UNIQUE NOT NULL, "password" VARCHAR, "salt" VARCHAR
);
CREATE TABLE "properties" (
  "property_id" SERIAL PRIMARY KEY, "host_id" INT NOT NULL, "title" VARCHAR(100),
  "city_location" VARCHAR(100), "nightly_rate" INT,
  CONSTRAINT "FK_properties_host_id" FOREIGN KEY ("host_id") REFERENCES "users"("user_id")
);
CREATE TABLE "amenities" (
  "amenity_id" SERIAL PRIMARY KEY, "amenity_name" VARCHAR(50) UNIQUE NOT NULL
);
CREATE TABLE "property_amenities" (
  "property_id" INT NOT NULL, "amenity_id" INT NOT NULL,
  PRIMARY KEY ("property_id", "amenity_id"),
  CONSTRAINT "FK_pa_property" FOREIGN KEY ("property_id") REFERENCES "properties"("property_id"),
  CONSTRAINT "FK_pa_amenity" FOREIGN KEY ("amenity_id") REFERENCES "amenities"("amenity_id")
);
CREATE TABLE "property_availability" (
  "availability_id" SERIAL PRIMARY KEY, "property_id" INT NOT NULL,
  "start_date" DATE, "end_date" DATE, "is_available" BOOLEAN DEFAULT TRUE,
  CONSTRAINT "FK_pav_property" FOREIGN KEY ("property_id") REFERENCES "properties"("property_id")
);
CREATE TABLE "bookings" (
  "booking_id" SERIAL PRIMARY KEY, "property_id" INT NOT NULL, "guest_id" INT NOT NULL,
  "check_in_date" DATE, "check_out_date" DATE, "total_price" INT,
  CONSTRAINT "FK_b_property" FOREIGN KEY ("property_id") REFERENCES "properties"("property_id"),
  CONSTRAINT "FK_b_guest" FOREIGN KEY ("guest_id") REFERENCES "users"("user_id")
);
```

**Notes:** `nightly_rate` and `total_price` in cents. One user type — any user can host or guest. `bookings` table exists in schema only; no routes/views in v1.

---

## 2. Key SQL Queries

```sql
-- Amenities for a property
SELECT amenities.* FROM amenities
JOIN property_amenities ON amenities.amenity_id = property_amenities.amenity_id
WHERE property_amenities.property_id = $1 ORDER BY amenities.amenity_name;

-- All properties with host name
SELECT properties.*, users.first_name, users.last_name
FROM properties JOIN users ON properties.host_id = users.user_id
ORDER BY properties.property_id;

-- Properties for a host (profile page)
SELECT * FROM properties WHERE host_id = $1 ORDER BY property_id;

-- Availability for a property
SELECT * FROM property_availability WHERE property_id = $1 ORDER BY start_date;
```

**setForProperty pattern** (delete-then-insert): delete all `property_amenities` rows for the property, then insert each selected `amenity_id`. Handle single value vs array from `req.body`.

---

## 3. Coding Conventions

- `async/await` everywhere — never `.then()` chains
- `$1, $2, ...` parameterized queries — never string interpolation in SQL
- camelCase in JS, snake_case in SQL — `camelize()` handles conversion
- Models handle all SQL. Routes handle all HTTP. Never cross.
- Always `await` DB writes before redirecting
- `res.redirect(303, '/path')` after every POST
- Flash: `req.session.flash = { type: 'success'|'danger', intro: '...', message: '...' }`
- Every POST form needs: `<input type="hidden" name="_csrf" value="{{_csrfToken}}">`
- `host_id` always set from `req.session.currentUser.userId` — never a form field
- `nightly_rate`: form accepts dollars, convert with `Math.round(parseFloat(val) * 100)` before saving; display with `formatCents` helper

---

## 4. Remaining Build Phases

### Phase 6 — Property Amenities (Junction Table)
**Goal:** Host can assign amenities to a property. Property detail shows amenities.

1. Create `models/property_amenity.js`: `allForProperty(propertyId)`, `setForProperty(propertyId, amenityIds)`
2. Update `routes/properties.js`:
   - `GET /properties/show/:id` — add `amenities` via `allForProperty`
   - `GET /properties/form` — pass all amenities; pre-select current ones when editing
   - `POST /properties/upsert` — call `setForProperty(propertyId, req.body.amenityIds)` after save
3. Update `properties/form.handlebars` — multi-select for amenities (same pattern as BookedIn `authorIds`)
4. Update `properties/show.handlebars` — display amenities as tags or list
5. Test: edit property → select amenities → save → verify on detail page

**Commit:** `"Phase 6: property amenities junction table"`

---

### Phase 7 — Property Availability
**Goal:** Hosts can add/remove date range availability windows on their properties.

1. Create `models/property_availability.js`: `allForProperty(propertyId)`, `add(availability)`, `remove(availabilityId)`
2. Create `routes/property_availability.js`:
   - `POST /property_availability/add` — requires login, must own property
   - `POST /property_availability/remove` — requires login, must own property
3. Update `properties/show.handlebars`:
   - If viewer is the host: show add-availability form (start_date, end_date, is_available checkbox) + remove button on each existing window
   - If not host: display availability windows read-only
4. Test: add availability → see it listed → remove it

**Commit:** `"Phase 7: property availability"`

---

### Phase 8 — Render.com Deployment
**Goal:** App running publicly on Render.com.

1. Create `credentials.production.js` reading from `process.env.COOKIESECRET` and `process.env.DBCONNECTIONSTRING` — safe to commit, contains no secrets
2. On Render.com:
   - Create PostgreSQL database (free tier) → run `db.sql` and `data.sql` against External URL
   - Create Web Service from GitHub repo: build `npm install`, start `node ./roamer.js`
   - Set env vars: `COOKIESECRET` (any random string), `DBCONNECTIONSTRING` (Internal Database URL)
3. Verify live URL works

**Commit:** `"Phase 8: production deployment config"`

---

## 5. Out of Scope (v1)

- Booking flow — table exists, no routes/views
- Search and filtering — index shows all properties
- Property deletion
- User account editing
