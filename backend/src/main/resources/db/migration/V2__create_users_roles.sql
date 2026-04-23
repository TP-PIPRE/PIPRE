CREATE TABLE roles (
    id_role UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE users (
    id_user UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    age INT,
    grade VARCHAR(50),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    institution VARCHAR(255),
    zone VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_role (
    id_user UUID,
    id_role UUID,
    CONSTRAINT pk_user_role PRIMARY KEY (id_user, id_role),
    CONSTRAINT fk_user_role_user FOREIGN KEY (id_user)
       REFERENCES users(id_user)
       ON DELETE CASCADE,
    CONSTRAINT fk_user_role_role FOREIGN KEY (id_role)
       REFERENCES roles(id_role)
       ON DELETE CASCADE
);