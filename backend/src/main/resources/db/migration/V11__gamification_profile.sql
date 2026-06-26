-- Extend activity_results with gamification fields
ALTER TABLE activity_results ADD COLUMN stars INTEGER DEFAULT 0;
ALTER TABLE activity_results ADD COLUMN xp_earned INTEGER DEFAULT 0;
ALTER TABLE activity_results ADD COLUMN efficiency DECIMAL(5,2) DEFAULT 0;

-- Extend group_students as player profile
ALTER TABLE group_students ADD COLUMN level INTEGER DEFAULT 1;
ALTER TABLE group_students ADD COLUMN xp_total INTEGER DEFAULT 0;
ALTER TABLE group_students ADD COLUMN total_stars INTEGER DEFAULT 0;
ALTER TABLE group_students ADD COLUMN current_streak INTEGER DEFAULT 0;
ALTER TABLE group_students ADD COLUMN max_streak INTEGER DEFAULT 0;
ALTER TABLE group_students ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Achievement catalog
CREATE TABLE achievements (
    id_achievement VARCHAR(36) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    category VARCHAR(30),
    xp_reward INTEGER DEFAULT 0,
    hidden BOOLEAN DEFAULT FALSE
);

-- Player achievements (many-to-many)
CREATE TABLE player_achievements (
    id_player_achievement VARCHAR(36) PRIMARY KEY,
    id_student VARCHAR(36) NOT NULL,
    id_achievement VARCHAR(36) NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pa_student FOREIGN KEY (id_student) REFERENCES users(id_user) ON DELETE CASCADE,
    CONSTRAINT fk_pa_achievement FOREIGN KEY (id_achievement) REFERENCES achievements(id_achievement) ON DELETE CASCADE,
    UNIQUE(id_student, id_achievement)
);

-- Seed achievements
INSERT INTO achievements (id_achievement, code, name, description, icon, category, xp_reward, hidden) VALUES
('ach-001', 'PRIMER_RETO', 'Primer Reto', 'Completa tu primer reto de simulación', 'trophy', 'progreso', 100, false),
('ach-002', 'ITERADOR_10', 'Iterador', 'Usa un bucle REPETIR con 10 iteraciones', 'repeat', 'bucles', 150, false),
('ach-003', 'EFICIENTE', 'Eficiente', 'Completa un reto usando ≤50% del máximo de bloques permitidos', 'lightning', 'eficiencia', 200, false),
('ach-004', 'BUCLE_ANIDADO', 'Bucle Maestro', 'Anida 3 o más bucles en un solo programa', 'layers', 'bucles', 250, false),
('ach-005', 'RACHA_3', 'Racha de 3', 'Completa 3 retos consecutivos en una misma sesión', 'flame', 'persistencia', 100, false),
('ach-006', 'EXPLORADOR', 'Explorador', 'Completa al menos un reto en cada entorno disponible', 'globe', 'exploracion', 150, false),
('ach-007', 'SIN_ENERGIA', 'Al Límite', 'Completa un reto con menos del 10% de energía restante', 'battery', 'desafio', 200, false),
('ach-008', 'VELOCISTA', 'Velocista', 'Completa un reto en 3 intentos o menos', 'clock', 'velocidad', 150, false),
('ach-009', 'PERFECCIONISTA', 'Perfeccionista', 'Obtén 3 estrellas en todos los retos de un curso', 'star', 'maestria', 300, false),
('ach-010', 'TOP_3', 'Podio', 'Alcanza el top 3 del ranking global', 'crown', 'competitivo', 500, false);
