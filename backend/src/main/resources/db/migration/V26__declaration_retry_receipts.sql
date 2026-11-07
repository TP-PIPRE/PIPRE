CREATE TABLE declaration_retry_receipts (
    actor_id VARCHAR(36) NOT NULL REFERENCES users(id_user) ON DELETE CASCADE,
    operation VARCHAR(30) NOT NULL,
    retry_key VARCHAR(128) NOT NULL,
    request_hash VARCHAR(64) NOT NULL,
    result_id VARCHAR(36) NOT NULL,
    PRIMARY KEY(actor_id,operation,retry_key)
);
