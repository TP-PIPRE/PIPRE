CREATE TABLE courses (
    id_course UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    level VARCHAR(50),
    objective TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE modules (
    id_module UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_course UUID,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty VARCHAR(50),
    module_order INT,
    percentage_meta DECIMAL(5,2),

    CONSTRAINT fk_modules_course FOREIGN KEY (id_course)
        REFERENCES courses(id_course)
        ON DELETE CASCADE
);

CREATE TABLE lessons (
    id_lesson UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_module UUID,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    resource_type VARCHAR(100),

    CONSTRAINT fk_lessons_module FOREIGN KEY (id_module)
        REFERENCES modules(id_module)
        ON DELETE CASCADE
);

CREATE TABLE activities (
    id_activity UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_lesson UUID,
    name VARCHAR(255) NOT NULL,
    complexity VARCHAR(50),
    difficulty VARCHAR(50),
    logic_level INTEGER,
    type VARCHAR(100),

    CONSTRAINT fk_activities_lesson FOREIGN KEY (id_lesson)
        REFERENCES lessons(id_lesson)
        ON DELETE CASCADE
);

CREATE TABLE robotics_simulations (
    id_simulation UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_student UUID,
    id_activity UUID,
    is_random BOOLEAN DEFAULT FALSE,
    blocks_usage INTEGER,
    code_usage INTEGER,
    sensor_error DECIMAL(10,2),
    blockly_code TEXT,
    python_code TEXT,
    resolution_time INTEGER,
    result VARCHAR(255),
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_simulation_student FOREIGN KEY (id_student)
        REFERENCES users(id_user)
        ON DELETE CASCADE,

    CONSTRAINT fk_simulation_activity FOREIGN KEY (id_activity)
        REFERENCES activities(id_activity)
        ON DELETE CASCADE
);