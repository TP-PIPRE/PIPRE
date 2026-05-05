CREATE TABLE roles (
    id_role VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT
);

CREATE TABLE users (
    id_user VARCHAR(36) PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    grade VARCHAR(50),
    age INT,
    is_active BOOLEAN,
    registered_at TIMESTAMP
);

CREATE TABLE user_role (
    id_user VARCHAR(36),
    id_role VARCHAR(36),
    CONSTRAINT pk_user_role PRIMARY KEY (id_user, id_role),
    CONSTRAINT fk_user_role_user FOREIGN KEY (id_user)
       REFERENCES users(id_user)
       ON DELETE CASCADE,
    CONSTRAINT fk_user_role_role FOREIGN KEY (id_role)
       REFERENCES roles(id_role)
       ON DELETE CASCADE
);