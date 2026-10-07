-- Telemetry attempts from NeonFlow and TetriLogic simulators (thesis metrics)
CREATE TABLE telemetry_attempts (
    id_attempt VARCHAR(36) PRIMARY KEY,
    id_student VARCHAR(36) NOT NULL,
    game VARCHAR(20) NOT NULL,
    result VARCHAR(20) NOT NULL,
    tiempo_resolucion INTEGER DEFAULT 0,
    movimientos INTEGER DEFAULT 0,
    reinicios INTEGER DEFAULT 0,
    pistas_ia INTEGER DEFAULT 0,
    completed_at TIMESTAMP
);
