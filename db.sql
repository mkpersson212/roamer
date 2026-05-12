-- Active: 1774398201805@@127.0.0.1@5432

--The three lines below are for dev env only. Commented out for prod on render.com.
--DROP DATABASE IF EXISTS roamer;
--CREATE DATABASE roamer;
--\c roamer;

-- Stores registered user accounts. Each row is one user who can act as a host or a guest.
-- Columns: user_id (PK), first_name, last_name, unique email, hashed password, and salt.
CREATE TABLE "users" (
  "user_id"       SERIAL PRIMARY KEY,
  "first_name"    VARCHAR(50),
  "last_name"     VARCHAR(50),
  "email"         VARCHAR(100) UNIQUE NOT NULL,
  "password"      VARCHAR,
  "salt"          VARCHAR
);

-- Stores rental properties listed by hosts. nightly_rate is in cents.
-- host_id is a FK to users.user_id — the user who owns the listing.
CREATE TABLE "properties" (
  "property_id"   SERIAL PRIMARY KEY,
  "host_id"       INT NOT NULL,
  "title"         VARCHAR(100),
  "city_location" VARCHAR(100),
  "nightly_rate"  INT,
  CONSTRAINT "FK_properties_host_id"
    FOREIGN KEY ("host_id") REFERENCES "users"("user_id")
);

-- Lookup table of available amenity options (e.g. "WiFi", "Pool"). amenity_name is unique.
-- No FK references — rows here are referenced by property_amenities.
CREATE TABLE "amenities" (
  "amenity_id"    SERIAL PRIMARY KEY,
  "amenity_name"  VARCHAR(50) UNIQUE NOT NULL
);

-- Junction table linking properties to amenities (many-to-many). No extra columns.
-- Composite PK on (property_id, amenity_id); both columns are FKs to their parent tables.
CREATE TABLE "property_amenities" (
  "property_id"   INT NOT NULL,
  "amenity_id"    INT NOT NULL,
  PRIMARY KEY ("property_id", "amenity_id"),
  CONSTRAINT "FK_property_amenities_property_id"
    FOREIGN KEY ("property_id") REFERENCES "properties"("property_id"),
  CONSTRAINT "FK_property_amenities_amenity_id"
    FOREIGN KEY ("amenity_id") REFERENCES "amenities"("amenity_id")
);

-- Stores date-range availability windows for a property. is_available defaults to true, per Rik's recommendation.
-- property_id is a FK to properties.property_id. One property can have many windows.
CREATE TABLE "property_availability" (
  "availability_id" SERIAL PRIMARY KEY,
  "property_id"     INT NOT NULL,
  "start_date"      DATE,
  "end_date"        DATE,
  "is_available"    BOOLEAN DEFAULT TRUE,
  CONSTRAINT "FK_property_availability_property_id"
    FOREIGN KEY ("property_id") REFERENCES "properties"("property_id")
);

-- Stores guest bookings for a property. total_price is in cents.
-- property_id FK → properties; guest_id FK → users. Reserved for future use — no routes in v1.
CREATE TABLE "bookings" (
  "booking_id"      SERIAL PRIMARY KEY,
  "property_id"     INT NOT NULL,
  "guest_id"        INT NOT NULL,
  "check_in_date"   DATE,
  "check_out_date"  DATE,
  "total_price"     INT,
  CONSTRAINT "FK_bookings_property_id"
    FOREIGN KEY ("property_id") REFERENCES "properties"("property_id"),
  CONSTRAINT "FK_bookings_guest_id"
    FOREIGN KEY ("guest_id") REFERENCES "users"("user_id")
);
