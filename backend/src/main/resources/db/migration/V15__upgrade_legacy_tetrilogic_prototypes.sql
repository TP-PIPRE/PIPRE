-- V13 introduced description as nullable without backfilling original activities.
-- V14 deliberately preserved those historical rows. Upgrade only the two exact,
-- otherwise unedited seed prototypes, retaining activity/mission IDs and results.
CREATE TEMPORARY TABLE tetrilogic_legacy_prototype_upgrades (id_activity VARCHAR(36) PRIMARY KEY);

INSERT INTO tetrilogic_legacy_prototype_upgrades
SELECT a.id_activity FROM activities a
WHERE a.id_activity='act-c002-1' AND a.id_lesson='les-c002-r1' AND a.name='TetriLogic - Nivel 1'
  AND a.environment='tetrilogic' AND a.level_template='tetrilogic-1' AND a.logic_level='LOW'
  AND a.difficulty='EASY' AND a.complexity='EASY' AND a.type='robotics' AND a.display_order=1
  AND a.start_x=0 AND a.start_z=0 AND a.target_x=0 AND a.target_z=0 AND a.description IS NULL
  AND EXISTS (SELECT 1 FROM tetrilogic_templates t WHERE t.template_id='tetrilogic-v2-1' AND t.version=2)
  AND (SELECT count(*) FROM activity_missions m WHERE m.id_activity=a.id_activity)=1
  AND EXISTS (SELECT 1 FROM activity_missions m WHERE m.id_activity=a.id_activity
    AND m.title='Cubre el tablero 4x4'
    AND m.objective='Encaja los Tetriminos para cubrir el tablero cumpliendo el conteo de celdas por fila y columna.'
    AND m.max_blocks=0);

INSERT INTO tetrilogic_legacy_prototype_upgrades
SELECT a.id_activity FROM activities a
WHERE a.id_activity='act-c002-2' AND a.id_lesson='les-c002-r1' AND a.name='TetriLogic - Nivel 2'
  AND a.environment='tetrilogic' AND a.level_template='tetrilogic-2' AND a.logic_level='MEDIUM'
  AND a.difficulty='MEDIUM' AND a.complexity='MEDIUM' AND a.type='robotics' AND a.display_order=2
  AND a.start_x=0 AND a.start_z=0 AND a.target_x=0 AND a.target_z=0 AND a.description IS NULL
  AND EXISTS (SELECT 1 FROM tetrilogic_templates t WHERE t.template_id='tetrilogic-v2-2' AND t.version=2)
  AND (SELECT count(*) FROM activity_missions m WHERE m.id_activity=a.id_activity)=1
  AND EXISTS (SELECT 1 FROM activity_missions m WHERE m.id_activity=a.id_activity
    AND m.title='Esquiva las celdas bloqueadas'
    AND m.objective='Encaja los Tetriminos respetando las celdas bloqueadas de la fila inferior del tablero.'
    AND m.max_blocks=0);

UPDATE activities
SET level_template='tetrilogic-v2-1',
    description='Coloca las 3 piezas y cumple todos los conteos de filas y columnas. Cubre las celdas marcadas, respeta el orden y los contactos indicados; pueden quedar espacios vacíos.'
WHERE id_activity='act-c002-1' AND id_activity IN (SELECT id_activity FROM tetrilogic_legacy_prototype_upgrades);

UPDATE activities
SET level_template='tetrilogic-v2-2',
    description='Coloca las 3 piezas y cumple todos los conteos de filas y columnas. Cubre las celdas marcadas, respeta el orden y los contactos indicados; pueden quedar espacios vacíos.'
WHERE id_activity='act-c002-2' AND id_activity IN (SELECT id_activity FROM tetrilogic_legacy_prototype_upgrades);

UPDATE activity_missions
SET title='Primer encuentro',
    objective='Coloca las 3 piezas y cumple todos los conteos de filas y columnas. Cubre las celdas marcadas, respeta el orden y los contactos indicados; pueden quedar espacios vacíos.'
WHERE id_activity='act-c002-1' AND id_activity IN (SELECT id_activity FROM tetrilogic_legacy_prototype_upgrades);

UPDATE activity_missions
SET title='Giro de perspectiva',
    objective='Coloca las 3 piezas y cumple todos los conteos de filas y columnas. Cubre las celdas marcadas, respeta el orden y los contactos indicados; pueden quedar espacios vacíos.'
WHERE id_activity='act-c002-2' AND id_activity IN (SELECT id_activity FROM tetrilogic_legacy_prototype_upgrades);

DROP TABLE tetrilogic_legacy_prototype_upgrades;
