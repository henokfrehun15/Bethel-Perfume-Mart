-- Uploaded image URLs used to be stored as absolute URLs derived from
-- the request host at upload time (e.g. http://localhost:5000/uploads/x.png),
-- which broke as soon as the API was served from a different origin.
-- New uploads store only the mount path; clients resolve it against
-- the API origin. This migration normalises existing rows the same way.
UPDATE product_images
SET url = regexp_replace(url, '^https?://[^/]+(/uploads/[A-Za-z0-9._-]+)$', '\1')
WHERE url ~ '^https?://[^/]+/uploads/[A-Za-z0-9._-]+$';
