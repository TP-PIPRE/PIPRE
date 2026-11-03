-- Legacy rows deliberately retain NULL context; never invent historical events.
ALTER TABLE telemetry_attempts ADD COLUMN trace_context JSONB;
ALTER TABLE telemetry_attempts ADD COLUMN id_activity VARCHAR(36);
ALTER TABLE telemetry_attempts ADD COLUMN received_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE telemetry_attempts ADD COLUMN request_hash VARCHAR(64);
ALTER TABLE telemetry_attempts ADD CONSTRAINT fk_telemetry_activity FOREIGN KEY(id_activity) REFERENCES activities(id_activity) ON DELETE SET NULL;
-- Enforce new writes without deleting or falsely repairing pre-existing orphan observations.
ALTER TABLE telemetry_attempts ADD CONSTRAINT fk_telemetry_student FOREIGN KEY(id_student) REFERENCES users(id_user) ON DELETE CASCADE ${telemetry_fk_validation};
CREATE INDEX idx_telemetry_student_completed ON telemetry_attempts(id_student,completed_at);
CREATE INDEX idx_telemetry_activity ON telemetry_attempts(id_activity);
