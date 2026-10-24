-- Additive metadata: existing API clients and activities remain valid.
ALTER TABLE activities ADD COLUMN description TEXT;
ALTER TABLE activities ADD COLUMN display_order INTEGER CHECK (display_order >= 1);
ALTER TABLE activities ADD COLUMN level_template VARCHAR(40);

-- Only the four official boards have a known template. Never guess for custom activities.
UPDATE activities SET level_template = 'neonflow-1', display_order = 1
WHERE id_activity = 'act-c001-1' AND level_template IS NULL;
UPDATE activities SET level_template = 'neonflow-2', display_order = 2
WHERE id_activity = 'act-c001-2' AND level_template IS NULL;
UPDATE activities SET level_template = 'tetrilogic-1', display_order = 1
WHERE id_activity = 'act-c002-1' AND level_template IS NULL;
UPDATE activities SET level_template = 'tetrilogic-2', display_order = 2
WHERE id_activity = 'act-c002-2' AND level_template IS NULL;
