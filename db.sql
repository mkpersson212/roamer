-- Active: 1774398201805@@127.0.0.1@5432
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
  "nightly_rate"  INT,
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
  "total_price"     INT,
  CONSTRAINT "FK_bookings_property_id"
    FOREIGN KEY ("property_id") REFERENCES "properties"("property_id"),
  CONSTRAINT "FK_bookings_guest_id"
    FOREIGN KEY ("guest_id") REFERENCES "users"("user_id")
);
