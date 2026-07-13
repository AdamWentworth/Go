-- Add a nullable costume key to raid_bosses so event/costume raid bosses
-- can attach to the exact costume variant instead of collapsing onto the
-- base Pokemon form.

ALTER TABLE raid_bosses ADD COLUMN costume_id INTEGER;
