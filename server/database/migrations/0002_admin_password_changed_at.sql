-- Session invalidation: tokens issued before an admin changed their
-- password stop working. Existing rows are stamped with created_at so
-- currently valid tokens stay valid.
ALTER TABLE admins
    ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP;

UPDATE admins
SET password_changed_at = created_at
WHERE password_changed_at IS NULL;