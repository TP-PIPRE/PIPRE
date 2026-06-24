ALTER TABLE activities ADD COLUMN complexity VARCHAR(50);
ALTER TABLE activities ADD COLUMN difficulty VARCHAR(50);
ALTER TABLE activities ADD COLUMN type VARCHAR(50);
ALTER TABLE activities ADD COLUMN environment VARCHAR(50);
ALTER TABLE activities ADD COLUMN start_x DOUBLE PRECISION;
ALTER TABLE activities ADD COLUMN start_z DOUBLE PRECISION;
ALTER TABLE activities ADD COLUMN target_x DOUBLE PRECISION;
ALTER TABLE activities ADD COLUMN target_z DOUBLE PRECISION;

CREATE TABLE activity_missions (
    id_mission VARCHAR(50) PRIMARY KEY,
    id_activity VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    objective TEXT,
    max_blocks INT,
    CONSTRAINT fk_missions_activity FOREIGN KEY (id_activity) REFERENCES activities(id_activity) ON DELETE CASCADE
);
