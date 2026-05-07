CREATE TABLE courses (
    id_course VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    level VARCHAR(50),
    objective TEXT,
    created_at TIMESTAMP
);

CREATE TABLE modules (
    id_module VARCHAR(36) PRIMARY KEY,
    id_course VARCHAR(36),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_available BOOLEAN,
    module_order INT,
    percentage_meta DECIMAL(5,2),

    CONSTRAINT fk_modules_course FOREIGN KEY (id_course)
        REFERENCES courses(id_course)
        ON DELETE CASCADE
);

CREATE TABLE lessons (
    id_lesson VARCHAR(36) PRIMARY KEY,
    id_module VARCHAR(36),
    title VARCHAR(255) NOT NULL,
    content TEXT,
    resource_type VARCHAR(100),

    CONSTRAINT fk_lessons_module FOREIGN KEY (id_module)
        REFERENCES modules(id_module)
        ON DELETE CASCADE
);

CREATE TABLE activities (
    id_activity VARCHAR(36) PRIMARY KEY,
    id_lesson VARCHAR(36),
    name VARCHAR(255) NOT NULL,
    difficulty VARCHAR(50),
    logic_level INTEGER,
    type VARCHAR(100),

    CONSTRAINT fk_activities_lesson FOREIGN KEY (id_lesson)
        REFERENCES lessons(id_lesson)
        ON DELETE CASCADE
);

CREATE TABLE simulations (
    id_simulation VARCHAR(36) PRIMARY KEY,
    id_student VARCHAR(36),
    id_activity VARCHAR(36),
    is_random BOOLEAN,
    blocks_usage INTEGER,
    code_usage INTEGER,
    sensor_error DECIMAL(10,2),
    blockly_code TEXT,
    python_code TEXT,
    resolution_time INTEGER,
    result VARCHAR(255),
    date TIMESTAMP,

    CONSTRAINT fk_simulation_student FOREIGN KEY (id_student)
        REFERENCES users(id_user)
        ON DELETE CASCADE,

    CONSTRAINT fk_simulation_activity FOREIGN KEY (id_activity)
        REFERENCES activities(id_activity)
        ON DELETE CASCADE
);