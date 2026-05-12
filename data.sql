-- Pre-filled data for display purposes.

-- Amenities
INSERT INTO amenities (amenity_name) VALUES
  ('Backup Power'),
  ('Dedicated Desk'),
  ('Ergonomic Chair'),
  ('High-Speed WiFi'),
  ('Multiple Monitors'),
  ('Private Room'),
  ('Quiet Environment'),
  ('Standing Desk')
ON CONFLICT (amenity_name) DO NOTHING;

-- Users (passwords are placeholders — real hashing happens through the app)
INSERT INTO users (first_name, last_name, email, password, salt) VALUES
  ('Alex',  'Rivera',  'alex@example.com',  'placeholder', 'placeholder'),
  ('Sam',   'Nguyen',  'sam@example.com',   'placeholder', 'placeholder'),
  ('Jordan','Kim',     'jordan@example.com','placeholder', 'placeholder')
ON CONFLICT (email) DO NOTHING;

-- Properties (nightly_rate in cents)
INSERT INTO properties (host_id, title, city_location, nightly_rate) VALUES
  (1, 'Quiet Studio with Dedicated Desk',   'Portland, OR',  9500),
  (1, 'Bright Loft - Dual Monitor Setup',   'Austin, TX',   12500),
  (2, 'Private Room in Co-Living House',    'Denver, CO',    7500),
  (2, 'Downtown Apartment with Fast WiFi',  'Chicago, IL',  11000),
  (3, 'Ergonomic Home Office Suite',        'Seattle, WA',  15000);

-- Property amenities
-- Property 1: Quiet Studio
INSERT INTO property_amenities (property_id, amenity_id)
  SELECT 1, amenity_id FROM amenities
  WHERE amenity_name IN ('Dedicated Desk', 'Ergonomic Chair', 'High-Speed WiFi', 'Quiet Environment')
ON CONFLICT (property_id, amenity_id) DO NOTHING;

-- Property 2: Bright Loft
INSERT INTO property_amenities (property_id, amenity_id)
  SELECT 2, amenity_id FROM amenities
  WHERE amenity_name IN ('Dedicated Desk', 'Multiple Monitors', 'High-Speed WiFi', 'Standing Desk')
ON CONFLICT (property_id, amenity_id) DO NOTHING;

-- Property 3: Private Room
INSERT INTO property_amenities (property_id, amenity_id)
  SELECT 3, amenity_id FROM amenities
  WHERE amenity_name IN ('Private Room', 'High-Speed WiFi', 'Quiet Environment')
ON CONFLICT (property_id, amenity_id) DO NOTHING;

-- Property 4: Downtown Apartment
INSERT INTO property_amenities (property_id, amenity_id)
  SELECT 4, amenity_id FROM amenities
  WHERE amenity_name IN ('High-Speed WiFi', 'Dedicated Desk', 'Backup Power')
ON CONFLICT (property_id, amenity_id) DO NOTHING;

-- Property 5: Ergonomic Suite
INSERT INTO property_amenities (property_id, amenity_id)
  SELECT 5, amenity_id FROM amenities
  WHERE amenity_name IN ('Dedicated Desk', 'Ergonomic Chair', 'Standing Desk', 'Multiple Monitors', 'Private Room', 'Backup Power')
ON CONFLICT (property_id, amenity_id) DO NOTHING;
