ALTER TABLE simulations ADD COLUMN blockly_code TEXT;
ALTER TABLE simulations ADD COLUMN pseudocode TEXT;
ALTER TABLE simulations ADD COLUMN pseint_diagram TEXT;
ALTER TABLE simulations ADD COLUMN blocks_usage INT;
ALTER TABLE simulations ADD COLUMN code_usage INT;
ALTER TABLE simulations ADD COLUMN sensor_error DOUBLE PRECISION;
ALTER TABLE simulations ADD COLUMN resolution_time INT;
ALTER TABLE simulations ADD COLUMN predicted_score INT;
