-- Publish a new geometry revision. Existing templates and their session references remain valid.
INSERT INTO neonflow_templates(template_id,version,config) VALUES
    ('neonflow-v3-1',3,JSON '{"level":1,"width":4,"height":4,"blocked":[{"x":3,"y":0,"type":"BLOCK"},{"x":0,"y":2,"type":"BLOCK"}],"receptors":[{"position":{"x":3,"y":3,"type":"RECEPTOR"},"color":"red"}],"emitter":{"position":{"x":0,"y":0,"type":"EMPTY"},"direction":{"dx":1,"dy":0},"color":"red"},"templateId":"neonflow-v3-1","version":3}'),
    ('neonflow-v3-2',3,JSON '{"level":2,"width":4,"height":4,"blocked":[{"x":0,"y":1,"type":"BLOCK"},{"x":3,"y":2,"type":"BLOCK"}],"receptors":[{"position":{"x":3,"y":0,"type":"RECEPTOR"},"color":"red"}],"emitter":{"position":{"x":0,"y":2,"type":"EMPTY"},"direction":{"dx":1,"dy":0},"color":"red"},"templateId":"neonflow-v3-2","version":3}'),
    ('neonflow-v3-3',3,JSON '{"level":3,"width":4,"height":4,"blocked":[{"x":0,"y":1,"type":"BLOCK"},{"x":1,"y":2,"type":"BLOCK"}],"receptors":[{"position":{"x":0,"y":3,"type":"RECEPTOR"},"color":"red"}],"emitter":{"position":{"x":0,"y":0,"type":"EMPTY"},"direction":{"dx":1,"dy":0},"color":"red"},"templateId":"neonflow-v3-3","version":3}'),
    ('neonflow-v3-4',3,JSON '{"level":4,"width":4,"height":4,"blocked":[{"x":3,"y":1,"type":"BLOCK"},{"x":0,"y":3,"type":"BLOCK"},{"x":3,"y":3,"type":"BLOCK"}],"receptors":[{"position":{"x":3,"y":0,"type":"RECEPTOR"},"color":"green"}],"emitter":{"position":{"x":0,"y":2,"type":"EMPTY"},"direction":{"dx":1,"dy":0},"color":"green"},"templateId":"neonflow-v3-4","version":3}'),
    ('neonflow-v3-5',3,JSON '{"level":5,"width":4,"height":4,"blocked":[{"x":3,"y":1,"type":"BLOCK"},{"x":0,"y":2,"type":"BLOCK"},{"x":0,"y":3,"type":"BLOCK"}],"receptors":[{"position":{"x":3,"y":3,"type":"RECEPTOR"},"color":"blue"}],"emitter":{"position":{"x":0,"y":0,"type":"EMPTY"},"direction":{"dx":1,"dy":0},"color":"blue"},"templateId":"neonflow-v3-5","version":3}'),
    ('neonflow-v3-6',3,JSON '{"level":6,"width":4,"height":4,"blocked":[{"x":1,"y":0,"type":"BLOCK"},{"x":2,"y":3,"type":"BLOCK"},{"x":3,"y":3,"type":"BLOCK"}],"receptors":[{"position":{"x":3,"y":0,"type":"RECEPTOR"},"color":"red"}],"emitter":{"position":{"x":0,"y":3,"type":"EMPTY"},"direction":{"dx":1,"dy":0},"color":"red"},"templateId":"neonflow-v3-6","version":3}'),
    ('neonflow-v3-7',3,JSON '{"level":7,"width":4,"height":4,"blocked":[{"x":2,"y":0,"type":"BLOCK"},{"x":1,"y":3,"type":"BLOCK"}],"receptors":[{"position":{"x":3,"y":3,"type":"RECEPTOR"},"color":"green"}],"emitter":{"position":{"x":0,"y":0,"type":"EMPTY"},"direction":{"dx":1,"dy":0},"color":"green"},"templateId":"neonflow-v3-7","version":3}'),
    ('neonflow-v3-8',3,JSON '{"level":8,"width":4,"height":4,"blocked":[{"x":2,"y":0,"type":"BLOCK"},{"x":2,"y":3,"type":"BLOCK"}],"receptors":[{"position":{"x":3,"y":0,"type":"RECEPTOR"},"color":"blue"}],"emitter":{"position":{"x":0,"y":3,"type":"EMPTY"},"direction":{"dx":1,"dy":0},"color":"blue"},"templateId":"neonflow-v3-8","version":3}'),
    ('neonflow-v3-9',3,JSON '{"level":9,"width":4,"height":4,"blocked":[{"x":1,"y":1,"type":"BLOCK"},{"x":0,"y":2,"type":"BLOCK"}],"receptors":[{"position":{"x":0,"y":1,"type":"RECEPTOR"},"color":"red"}],"emitter":{"position":{"x":0,"y":3,"type":"EMPTY"},"direction":{"dx":1,"dy":0},"color":"red"},"templateId":"neonflow-v3-9","version":3}'),
    ('neonflow-v3-10',3,JSON '{"level":10,"width":4,"height":4,"blocked":[{"x":3,"y":0,"type":"BLOCK"},{"x":2,"y":1,"type":"BLOCK"}],"receptors":[{"position":{"x":3,"y":1,"type":"RECEPTOR"},"color":"green"}],"emitter":{"position":{"x":0,"y":0,"type":"EMPTY"},"direction":{"dx":1,"dy":0},"color":"green"},"templateId":"neonflow-v3-10","version":3}'),
    ('neonflow-v3-11',3,JSON '{"level":11,"width":5,"height":5,"blocked":[{"x":0,"y":0,"type":"BLOCK"},{"x":1,"y":1,"type":"BLOCK"},{"x":2,"y":2,"type":"BLOCK"},{"x":3,"y":4,"type":"BLOCK"}],"receptors":[{"position":{"x":1,"y":0,"type":"RECEPTOR"},"color":"blue"}],"emitter":{"position":{"x":0,"y":2,"type":"EMPTY"},"direction":{"dx":1,"dy":0},"color":"blue"},"templateId":"neonflow-v3-11","version":3}'),
    ('neonflow-v3-12',3,JSON '{"level":12,"width":5,"height":5,"blocked":[{"x":1,"y":0,"type":"BLOCK"},{"x":3,"y":0,"type":"BLOCK"},{"x":2,"y":1,"type":"BLOCK"},{"x":3,"y":2,"type":"BLOCK"}],"receptors":[{"position":{"x":3,"y":1,"type":"RECEPTOR"},"color":"red"}],"emitter":{"position":{"x":0,"y":1,"type":"EMPTY"},"direction":{"dx":1,"dy":0},"color":"red"},"templateId":"neonflow-v3-12","version":3}'),
    ('neonflow-v3-13',3,JSON '{"level":13,"width":5,"height":5,"blocked":[{"x":1,"y":1,"type":"BLOCK"},{"x":3,"y":1,"type":"BLOCK"},{"x":0,"y":2,"type":"BLOCK"},{"x":1,"y":2,"type":"BLOCK"},{"x":2,"y":3,"type":"BLOCK"},{"x":3,"y":3,"type":"BLOCK"},{"x":0,"y":4,"type":"BLOCK"}],"receptors":[{"position":{"x":0,"y":0,"type":"RECEPTOR"},"color":"green"}],"emitter":{"position":{"x":0,"y":3,"type":"EMPTY"},"direction":{"dx":1,"dy":0},"color":"green"},"templateId":"neonflow-v3-13","version":3}'),
    ('neonflow-v3-14',3,JSON '{"level":14,"width":5,"height":5,"blocked":[{"x":2,"y":0,"type":"BLOCK"},{"x":3,"y":1,"type":"BLOCK"},{"x":2,"y":2,"type":"BLOCK"},{"x":0,"y":4,"type":"BLOCK"},{"x":4,"y":4,"type":"BLOCK"}],"receptors":[{"position":{"x":3,"y":0,"type":"RECEPTOR"},"color":"blue"}],"emitter":{"position":{"x":0,"y":0,"type":"EMPTY"},"direction":{"dx":1,"dy":0},"color":"blue"},"templateId":"neonflow-v3-14","version":3}'),
    ('neonflow-v3-15',3,JSON '{"level":15,"width":5,"height":5,"blocked":[{"x":4,"y":0,"type":"BLOCK"},{"x":1,"y":1,"type":"BLOCK"},{"x":2,"y":2,"type":"BLOCK"},{"x":1,"y":3,"type":"BLOCK"}],"receptors":[{"position":{"x":1,"y":2,"type":"RECEPTOR"},"color":"red"}],"emitter":{"position":{"x":0,"y":4,"type":"EMPTY"},"direction":{"dx":1,"dy":0},"color":"red"},"templateId":"neonflow-v3-15","version":3}'),
    ('neonflow-v3-16',3,JSON '{"level":16,"width":5,"height":5,"blocked":[{"x":2,"y":0,"type":"BLOCK"},{"x":3,"y":0,"type":"BLOCK"},{"x":4,"y":0,"type":"BLOCK"},{"x":0,"y":1,"type":"BLOCK"},{"x":1,"y":2,"type":"BLOCK"},{"x":2,"y":3,"type":"BLOCK"},{"x":3,"y":3,"type":"BLOCK"}],"receptors":[{"position":{"x":0,"y":2,"type":"RECEPTOR"},"color":"green"}],"emitter":{"position":{"x":0,"y":0,"type":"EMPTY"},"direction":{"dx":1,"dy":0},"color":"green"},"templateId":"neonflow-v3-16","version":3}'),
    ('neonflow-v3-17',3,JSON '{"level":17,"width":5,"height":5,"blocked":[{"x":2,"y":0,"type":"BLOCK"},{"x":2,"y":1,"type":"BLOCK"},{"x":1,"y":2,"type":"BLOCK"},{"x":4,"y":4,"type":"BLOCK"}],"receptors":[{"position":{"x":4,"y":0,"type":"RECEPTOR"},"color":"blue"}],"emitter":{"position":{"x":0,"y":0,"type":"EMPTY"},"direction":{"dx":1,"dy":0},"color":"blue"},"templateId":"neonflow-v3-17","version":3}'),
    ('neonflow-v3-18',3,JSON '{"level":18,"width":5,"height":5,"blocked":[{"x":3,"y":0,"type":"BLOCK"},{"x":2,"y":1,"type":"BLOCK"},{"x":1,"y":2,"type":"BLOCK"},{"x":3,"y":4,"type":"BLOCK"}],"receptors":[{"position":{"x":4,"y":0,"type":"RECEPTOR"},"color":"red"}],"emitter":{"position":{"x":0,"y":0,"type":"EMPTY"},"direction":{"dx":1,"dy":0},"color":"red"},"templateId":"neonflow-v3-18","version":3}'),
    ('neonflow-v3-19',3,JSON '{"level":19,"width":5,"height":5,"blocked":[{"x":2,"y":1,"type":"BLOCK"},{"x":0,"y":2,"type":"BLOCK"},{"x":1,"y":2,"type":"BLOCK"},{"x":2,"y":4,"type":"BLOCK"}],"receptors":[{"position":{"x":1,"y":4,"type":"RECEPTOR"},"color":"green"}],"emitter":{"position":{"x":0,"y":1,"type":"EMPTY"},"direction":{"dx":1,"dy":0},"color":"green"},"templateId":"neonflow-v3-19","version":3}'),
    ('neonflow-v3-20',3,JSON '{"level":20,"width":5,"height":5,"blocked":[{"x":3,"y":0,"type":"BLOCK"},{"x":3,"y":1,"type":"BLOCK"},{"x":1,"y":2,"type":"BLOCK"},{"x":2,"y":2,"type":"BLOCK"},{"x":1,"y":3,"type":"BLOCK"}],"receptors":[{"position":{"x":4,"y":0,"type":"RECEPTOR"},"color":"blue"}],"emitter":{"position":{"x":0,"y":1,"type":"EMPTY"},"direction":{"dx":1,"dy":0},"color":"blue"},"templateId":"neonflow-v3-20","version":3}'),
    ('neonflow-v3-21',3,JSON '{"level":21,"width":6,"height":6,"blocked":[{"x":1,"y":1,"type":"BLOCK"},{"x":3,"y":2,"type":"BLOCK"},{"x":4,"y":3,"type":"BLOCK"},{"x":2,"y":4,"type":"BLOCK"},{"x":3,"y":4,"type":"BLOCK"},{"x":3,"y":5,"type":"BLOCK"},{"x":4,"y":5,"type":"BLOCK"}],"receptors":[{"position":{"x":4,"y":4,"type":"RECEPTOR"},"color":"red"}],"emitter":{"position":{"x":0,"y":4,"type":"EMPTY"},"direction":{"dx":1,"dy":0},"color":"red"},"templateId":"neonflow-v3-21","version":3}'),
    ('neonflow-v3-22',3,JSON '{"level":22,"width":6,"height":6,"blocked":[{"x":5,"y":1,"type":"BLOCK"},{"x":3,"y":2,"type":"BLOCK"},{"x":0,"y":3,"type":"BLOCK"},{"x":2,"y":3,"type":"BLOCK"},{"x":1,"y":4,"type":"BLOCK"},{"x":4,"y":4,"type":"BLOCK"},{"x":5,"y":4,"type":"BLOCK"},{"x":5,"y":5,"type":"BLOCK"}],"receptors":[{"position":{"x":0,"y":5,"type":"RECEPTOR"},"color":"green"}],"emitter":{"position":{"x":0,"y":2,"type":"EMPTY"},"direction":{"dx":1,"dy":0},"color":"green"},"templateId":"neonflow-v3-22","version":3}'),
    ('neonflow-v3-23',3,JSON '{"level":23,"width":6,"height":6,"blocked":[{"x":2,"y":0,"type":"BLOCK"},{"x":2,"y":1,"type":"BLOCK"},{"x":3,"y":1,"type":"BLOCK"},{"x":4,"y":2,"type":"BLOCK"},{"x":4,"y":3,"type":"BLOCK"},{"x":0,"y":4,"type":"BLOCK"},{"x":2,"y":4,"type":"BLOCK"},{"x":0,"y":5,"type":"BLOCK"},{"x":1,"y":5,"type":"BLOCK"}],"receptors":[{"position":{"x":3,"y":0,"type":"RECEPTOR"},"color":"blue"}],"emitter":{"position":{"x":0,"y":1,"type":"EMPTY"},"direction":{"dx":1,"dy":0},"color":"blue"},"templateId":"neonflow-v3-23","version":3}'),
    ('neonflow-v3-24',3,JSON '{"level":24,"width":6,"height":6,"blocked":[{"x":4,"y":0,"type":"BLOCK"},{"x":1,"y":1,"type":"BLOCK"},{"x":2,"y":2,"type":"BLOCK"},{"x":3,"y":2,"type":"BLOCK"},{"x":3,"y":3,"type":"BLOCK"},{"x":0,"y":4,"type":"BLOCK"},{"x":0,"y":5,"type":"BLOCK"}],"receptors":[{"position":{"x":0,"y":3,"type":"RECEPTOR"},"color":"red"}],"emitter":{"position":{"x":0,"y":0,"type":"EMPTY"},"direction":{"dx":1,"dy":0},"color":"red"},"templateId":"neonflow-v3-24","version":3}'),
    ('neonflow-v3-25',3,JSON '{"level":25,"width":6,"height":6,"blocked":[{"x":3,"y":0,"type":"BLOCK"},{"x":2,"y":1,"type":"BLOCK"},{"x":3,"y":2,"type":"BLOCK"},{"x":3,"y":3,"type":"BLOCK"},{"x":5,"y":3,"type":"BLOCK"},{"x":0,"y":4,"type":"BLOCK"},{"x":1,"y":4,"type":"BLOCK"},{"x":5,"y":5,"type":"BLOCK"}],"receptors":[{"position":{"x":5,"y":1,"type":"RECEPTOR"},"color":"green"}],"emitter":{"position":{"x":0,"y":1,"type":"EMPTY"},"direction":{"dx":1,"dy":0},"color":"green"},"templateId":"neonflow-v3-25","version":3}'),
    ('neonflow-v3-26',3,JSON '{"level":26,"width":6,"height":6,"blocked":[{"x":4,"y":0,"type":"BLOCK"},{"x":5,"y":0,"type":"BLOCK"},{"x":1,"y":1,"type":"BLOCK"},{"x":2,"y":2,"type":"BLOCK"},{"x":5,"y":2,"type":"BLOCK"},{"x":0,"y":3,"type":"BLOCK"},{"x":3,"y":3,"type":"BLOCK"},{"x":3,"y":4,"type":"BLOCK"},{"x":4,"y":4,"type":"BLOCK"}],"receptors":[{"position":{"x":2,"y":0,"type":"RECEPTOR"},"color":"blue"}],"emitter":{"position":{"x":0,"y":2,"type":"EMPTY"},"direction":{"dx":1,"dy":0},"color":"blue"},"templateId":"neonflow-v3-26","version":3}'),
    ('neonflow-v3-27',3,JSON '{"level":27,"width":6,"height":6,"blocked":[{"x":2,"y":0,"type":"BLOCK"},{"x":0,"y":1,"type":"BLOCK"},{"x":1,"y":2,"type":"BLOCK"},{"x":2,"y":3,"type":"BLOCK"},{"x":0,"y":4,"type":"BLOCK"},{"x":2,"y":4,"type":"BLOCK"},{"x":3,"y":4,"type":"BLOCK"}],"receptors":[{"position":{"x":0,"y":2,"type":"RECEPTOR"},"color":"red"}],"emitter":{"position":{"x":0,"y":0,"type":"EMPTY"},"direction":{"dx":1,"dy":0},"color":"red"},"templateId":"neonflow-v3-27","version":3}'),
    ('neonflow-v3-28',3,JSON '{"level":28,"width":6,"height":6,"blocked":[{"x":3,"y":0,"type":"BLOCK"},{"x":2,"y":1,"type":"BLOCK"},{"x":3,"y":1,"type":"BLOCK"},{"x":1,"y":2,"type":"BLOCK"},{"x":2,"y":3,"type":"BLOCK"},{"x":0,"y":4,"type":"BLOCK"},{"x":0,"y":5,"type":"BLOCK"},{"x":3,"y":5,"type":"BLOCK"},{"x":4,"y":5,"type":"BLOCK"}],"receptors":[{"position":{"x":5,"y":0,"type":"RECEPTOR"},"color":"green"}],"emitter":{"position":{"x":0,"y":1,"type":"EMPTY"},"direction":{"dx":1,"dy":0},"color":"green"},"templateId":"neonflow-v3-28","version":3}'),
    ('neonflow-v3-29',3,JSON '{"level":29,"width":6,"height":6,"blocked":[{"x":0,"y":0,"type":"BLOCK"},{"x":2,"y":1,"type":"BLOCK"},{"x":1,"y":2,"type":"BLOCK"},{"x":4,"y":2,"type":"BLOCK"},{"x":3,"y":3,"type":"BLOCK"},{"x":3,"y":4,"type":"BLOCK"},{"x":0,"y":5,"type":"BLOCK"}],"receptors":[{"position":{"x":0,"y":2,"type":"RECEPTOR"},"color":"blue"}],"emitter":{"position":{"x":0,"y":1,"type":"EMPTY"},"direction":{"dx":1,"dy":0},"color":"blue"},"templateId":"neonflow-v3-29","version":3}'),
    ('neonflow-v3-30',3,JSON '{"level":30,"width":6,"height":6,"blocked":[{"x":2,"y":0,"type":"BLOCK"},{"x":3,"y":0,"type":"BLOCK"},{"x":5,"y":0,"type":"BLOCK"},{"x":3,"y":1,"type":"BLOCK"},{"x":0,"y":2,"type":"BLOCK"},{"x":2,"y":2,"type":"BLOCK"},{"x":4,"y":2,"type":"BLOCK"},{"x":2,"y":3,"type":"BLOCK"},{"x":1,"y":4,"type":"BLOCK"}],"receptors":[{"position":{"x":4,"y":0,"type":"RECEPTOR"},"color":"red"}],"emitter":{"position":{"x":0,"y":0,"type":"EMPTY"},"direction":{"dx":1,"dy":0},"color":"red"},"templateId":"neonflow-v3-30","version":3}')
ON CONFLICT DO NOTHING;

-- Update only original official bindings. Refresh stock copy independently of custom copy.
UPDATE activities SET level_template='neonflow-v3-1',
    description=CASE WHEN description='Guía el haz red hasta el receptor en el tablero 4×4, usando espejos y filtros del mismo color.' THEN 'Guía el haz rojo hasta el receptor en el tablero 4×4. Encadena giros para rodear los obstáculos.' ELSE description END
WHERE id_activity='act-c001-v2-1' AND environment='neonflow' AND level_template='neonflow-v2-1'
    AND EXISTS(SELECT 1 FROM lessons l JOIN modules m ON m.id_module=l.id_module WHERE l.id_lesson=activities.id_lesson AND m.id_course='c001');
UPDATE activity_missions SET objective='Guía el haz rojo hasta el receptor en el tablero 4×4. Encadena giros para rodear los obstáculos.'
WHERE id_mission='mis-c001-v2-1' AND id_activity='act-c001-v2-1' AND objective='Guía el haz red hasta el receptor en el tablero 4×4, usando espejos y filtros del mismo color.'
    AND EXISTS(SELECT 1 FROM activities a WHERE a.id_activity=activity_missions.id_activity AND a.level_template='neonflow-v3-1');
UPDATE activities SET level_template='neonflow-v3-2',
    description=CASE WHEN description='Guía el haz red hasta el receptor en el tablero 4×4, usando espejos y filtros del mismo color.' THEN 'Guía el haz rojo hasta el receptor en el tablero 4×4. Encadena giros para rodear los obstáculos.' ELSE description END
WHERE id_activity='act-c001-v2-2' AND environment='neonflow' AND level_template='neonflow-v2-2'
    AND EXISTS(SELECT 1 FROM lessons l JOIN modules m ON m.id_module=l.id_module WHERE l.id_lesson=activities.id_lesson AND m.id_course='c001');
UPDATE activity_missions SET objective='Guía el haz rojo hasta el receptor en el tablero 4×4. Encadena giros para rodear los obstáculos.'
WHERE id_mission='mis-c001-v2-2' AND id_activity='act-c001-v2-2' AND objective='Guía el haz red hasta el receptor en el tablero 4×4, usando espejos y filtros del mismo color.'
    AND EXISTS(SELECT 1 FROM activities a WHERE a.id_activity=activity_missions.id_activity AND a.level_template='neonflow-v3-2');
UPDATE activities SET level_template='neonflow-v3-3',
    description=CASE WHEN description='Guía el haz red hasta el receptor en el tablero 4×4, usando espejos y filtros del mismo color.' THEN 'Guía el haz rojo hasta el receptor en el tablero 4×4. Encadena giros para rodear los obstáculos.' ELSE description END
WHERE id_activity='act-c001-3' AND environment='neonflow' AND level_template='neonflow-v2-3'
    AND EXISTS(SELECT 1 FROM lessons l JOIN modules m ON m.id_module=l.id_module WHERE l.id_lesson=activities.id_lesson AND m.id_course='c001');
UPDATE activity_missions SET objective='Guía el haz rojo hasta el receptor en el tablero 4×4. Encadena giros para rodear los obstáculos.'
WHERE id_mission='mis-c001-v2-3' AND id_activity='act-c001-3' AND objective='Guía el haz red hasta el receptor en el tablero 4×4, usando espejos y filtros del mismo color.'
    AND EXISTS(SELECT 1 FROM activities a WHERE a.id_activity=activity_missions.id_activity AND a.level_template='neonflow-v3-3');
UPDATE activities SET level_template='neonflow-v3-4',
    description=CASE WHEN description='Guía el haz green hasta el receptor en el tablero 4×4, usando espejos y filtros del mismo color.' THEN 'Guía el haz verde hasta el receptor en el tablero 4×4. Encadena giros para rodear los obstáculos.' ELSE description END
WHERE id_activity='act-c001-4' AND environment='neonflow' AND level_template='neonflow-v2-4'
    AND EXISTS(SELECT 1 FROM lessons l JOIN modules m ON m.id_module=l.id_module WHERE l.id_lesson=activities.id_lesson AND m.id_course='c001');
UPDATE activity_missions SET objective='Guía el haz verde hasta el receptor en el tablero 4×4. Encadena giros para rodear los obstáculos.'
WHERE id_mission='mis-c001-v2-4' AND id_activity='act-c001-4' AND objective='Guía el haz green hasta el receptor en el tablero 4×4, usando espejos y filtros del mismo color.'
    AND EXISTS(SELECT 1 FROM activities a WHERE a.id_activity=activity_missions.id_activity AND a.level_template='neonflow-v3-4');
UPDATE activities SET level_template='neonflow-v3-5',
    description=CASE WHEN description='Guía el haz blue hasta el receptor en el tablero 4×4, usando espejos y filtros del mismo color.' THEN 'Guía el haz azul hasta el receptor en el tablero 4×4. Encadena giros para rodear los obstáculos.' ELSE description END
WHERE id_activity='act-c001-5' AND environment='neonflow' AND level_template='neonflow-v2-5'
    AND EXISTS(SELECT 1 FROM lessons l JOIN modules m ON m.id_module=l.id_module WHERE l.id_lesson=activities.id_lesson AND m.id_course='c001');
UPDATE activity_missions SET objective='Guía el haz azul hasta el receptor en el tablero 4×4. Encadena giros para rodear los obstáculos.'
WHERE id_mission='mis-c001-v2-5' AND id_activity='act-c001-5' AND objective='Guía el haz blue hasta el receptor en el tablero 4×4, usando espejos y filtros del mismo color.'
    AND EXISTS(SELECT 1 FROM activities a WHERE a.id_activity=activity_missions.id_activity AND a.level_template='neonflow-v3-5');
UPDATE activities SET level_template='neonflow-v3-6',
    description=CASE WHEN description='Guía el haz red hasta el receptor en el tablero 4×4, usando espejos y filtros del mismo color.' THEN 'Guía el haz rojo hasta el receptor en el tablero 4×4. Encadena giros para rodear los obstáculos.' ELSE description END
WHERE id_activity='act-c001-6' AND environment='neonflow' AND level_template='neonflow-v2-6'
    AND EXISTS(SELECT 1 FROM lessons l JOIN modules m ON m.id_module=l.id_module WHERE l.id_lesson=activities.id_lesson AND m.id_course='c001');
UPDATE activity_missions SET objective='Guía el haz rojo hasta el receptor en el tablero 4×4. Encadena giros para rodear los obstáculos.'
WHERE id_mission='mis-c001-v2-6' AND id_activity='act-c001-6' AND objective='Guía el haz red hasta el receptor en el tablero 4×4, usando espejos y filtros del mismo color.'
    AND EXISTS(SELECT 1 FROM activities a WHERE a.id_activity=activity_missions.id_activity AND a.level_template='neonflow-v3-6');
UPDATE activities SET level_template='neonflow-v3-7',
    description=CASE WHEN description='Guía el haz green hasta el receptor en el tablero 4×4, usando espejos y filtros del mismo color.' THEN 'Guía el haz verde hasta el receptor en el tablero 4×4. Encadena giros para rodear los obstáculos.' ELSE description END
WHERE id_activity='act-c001-7' AND environment='neonflow' AND level_template='neonflow-v2-7'
    AND EXISTS(SELECT 1 FROM lessons l JOIN modules m ON m.id_module=l.id_module WHERE l.id_lesson=activities.id_lesson AND m.id_course='c001');
UPDATE activity_missions SET objective='Guía el haz verde hasta el receptor en el tablero 4×4. Encadena giros para rodear los obstáculos.'
WHERE id_mission='mis-c001-v2-7' AND id_activity='act-c001-7' AND objective='Guía el haz green hasta el receptor en el tablero 4×4, usando espejos y filtros del mismo color.'
    AND EXISTS(SELECT 1 FROM activities a WHERE a.id_activity=activity_missions.id_activity AND a.level_template='neonflow-v3-7');
UPDATE activities SET level_template='neonflow-v3-8',
    description=CASE WHEN description='Guía el haz blue hasta el receptor en el tablero 4×4, usando espejos y filtros del mismo color.' THEN 'Guía el haz azul hasta el receptor en el tablero 4×4. Encadena giros para rodear los obstáculos.' ELSE description END
WHERE id_activity='act-c001-8' AND environment='neonflow' AND level_template='neonflow-v2-8'
    AND EXISTS(SELECT 1 FROM lessons l JOIN modules m ON m.id_module=l.id_module WHERE l.id_lesson=activities.id_lesson AND m.id_course='c001');
UPDATE activity_missions SET objective='Guía el haz azul hasta el receptor en el tablero 4×4. Encadena giros para rodear los obstáculos.'
WHERE id_mission='mis-c001-v2-8' AND id_activity='act-c001-8' AND objective='Guía el haz blue hasta el receptor en el tablero 4×4, usando espejos y filtros del mismo color.'
    AND EXISTS(SELECT 1 FROM activities a WHERE a.id_activity=activity_missions.id_activity AND a.level_template='neonflow-v3-8');
UPDATE activities SET level_template='neonflow-v3-9',
    description=CASE WHEN description='Guía el haz red hasta el receptor en el tablero 4×4, usando espejos y filtros del mismo color.' THEN 'Guía el haz rojo hasta el receptor en el tablero 4×4. Encadena giros para rodear los obstáculos.' ELSE description END
WHERE id_activity='act-c001-9' AND environment='neonflow' AND level_template='neonflow-v2-9'
    AND EXISTS(SELECT 1 FROM lessons l JOIN modules m ON m.id_module=l.id_module WHERE l.id_lesson=activities.id_lesson AND m.id_course='c001');
UPDATE activity_missions SET objective='Guía el haz rojo hasta el receptor en el tablero 4×4. Encadena giros para rodear los obstáculos.'
WHERE id_mission='mis-c001-v2-9' AND id_activity='act-c001-9' AND objective='Guía el haz red hasta el receptor en el tablero 4×4, usando espejos y filtros del mismo color.'
    AND EXISTS(SELECT 1 FROM activities a WHERE a.id_activity=activity_missions.id_activity AND a.level_template='neonflow-v3-9');
UPDATE activities SET level_template='neonflow-v3-10',
    description=CASE WHEN description='Guía el haz green hasta el receptor en el tablero 4×4, usando espejos y filtros del mismo color.' THEN 'Guía el haz verde hasta el receptor en el tablero 4×4. Encadena giros para rodear los obstáculos.' ELSE description END
WHERE id_activity='act-c001-10' AND environment='neonflow' AND level_template='neonflow-v2-10'
    AND EXISTS(SELECT 1 FROM lessons l JOIN modules m ON m.id_module=l.id_module WHERE l.id_lesson=activities.id_lesson AND m.id_course='c001');
UPDATE activity_missions SET objective='Guía el haz verde hasta el receptor en el tablero 4×4. Encadena giros para rodear los obstáculos.'
WHERE id_mission='mis-c001-v2-10' AND id_activity='act-c001-10' AND objective='Guía el haz green hasta el receptor en el tablero 4×4, usando espejos y filtros del mismo color.'
    AND EXISTS(SELECT 1 FROM activities a WHERE a.id_activity=activity_missions.id_activity AND a.level_template='neonflow-v3-10');
UPDATE activities SET level_template='neonflow-v3-11',
    description=CASE WHEN description='Guía el haz blue hasta el receptor en el tablero 5×5, usando espejos y filtros del mismo color.' THEN 'Guía el haz azul hasta el receptor en el tablero 5×5. Encadena giros para rodear los obstáculos.' ELSE description END
WHERE id_activity='act-c001-11' AND environment='neonflow' AND level_template='neonflow-v2-11'
    AND EXISTS(SELECT 1 FROM lessons l JOIN modules m ON m.id_module=l.id_module WHERE l.id_lesson=activities.id_lesson AND m.id_course='c001');
UPDATE activity_missions SET objective='Guía el haz azul hasta el receptor en el tablero 5×5. Encadena giros para rodear los obstáculos.'
WHERE id_mission='mis-c001-v2-11' AND id_activity='act-c001-11' AND objective='Guía el haz blue hasta el receptor en el tablero 5×5, usando espejos y filtros del mismo color.'
    AND EXISTS(SELECT 1 FROM activities a WHERE a.id_activity=activity_missions.id_activity AND a.level_template='neonflow-v3-11');
UPDATE activities SET level_template='neonflow-v3-12',
    description=CASE WHEN description='Guía el haz red hasta el receptor en el tablero 5×5, usando espejos y filtros del mismo color.' THEN 'Guía el haz rojo hasta el receptor en el tablero 5×5. Encadena giros para rodear los obstáculos.' ELSE description END
WHERE id_activity='act-c001-12' AND environment='neonflow' AND level_template='neonflow-v2-12'
    AND EXISTS(SELECT 1 FROM lessons l JOIN modules m ON m.id_module=l.id_module WHERE l.id_lesson=activities.id_lesson AND m.id_course='c001');
UPDATE activity_missions SET objective='Guía el haz rojo hasta el receptor en el tablero 5×5. Encadena giros para rodear los obstáculos.'
WHERE id_mission='mis-c001-v2-12' AND id_activity='act-c001-12' AND objective='Guía el haz red hasta el receptor en el tablero 5×5, usando espejos y filtros del mismo color.'
    AND EXISTS(SELECT 1 FROM activities a WHERE a.id_activity=activity_missions.id_activity AND a.level_template='neonflow-v3-12');
UPDATE activities SET level_template='neonflow-v3-13',
    description=CASE WHEN description='Guía el haz green hasta el receptor en el tablero 5×5, usando espejos y filtros del mismo color.' THEN 'Guía el haz verde hasta el receptor en el tablero 5×5. Encadena giros para rodear los obstáculos.' ELSE description END
WHERE id_activity='act-c001-13' AND environment='neonflow' AND level_template='neonflow-v2-13'
    AND EXISTS(SELECT 1 FROM lessons l JOIN modules m ON m.id_module=l.id_module WHERE l.id_lesson=activities.id_lesson AND m.id_course='c001');
UPDATE activity_missions SET objective='Guía el haz verde hasta el receptor en el tablero 5×5. Encadena giros para rodear los obstáculos.'
WHERE id_mission='mis-c001-v2-13' AND id_activity='act-c001-13' AND objective='Guía el haz green hasta el receptor en el tablero 5×5, usando espejos y filtros del mismo color.'
    AND EXISTS(SELECT 1 FROM activities a WHERE a.id_activity=activity_missions.id_activity AND a.level_template='neonflow-v3-13');
UPDATE activities SET level_template='neonflow-v3-14',
    description=CASE WHEN description='Guía el haz blue hasta el receptor en el tablero 5×5, usando espejos y filtros del mismo color.' THEN 'Guía el haz azul hasta el receptor en el tablero 5×5. Encadena giros para rodear los obstáculos.' ELSE description END
WHERE id_activity='act-c001-14' AND environment='neonflow' AND level_template='neonflow-v2-14'
    AND EXISTS(SELECT 1 FROM lessons l JOIN modules m ON m.id_module=l.id_module WHERE l.id_lesson=activities.id_lesson AND m.id_course='c001');
UPDATE activity_missions SET objective='Guía el haz azul hasta el receptor en el tablero 5×5. Encadena giros para rodear los obstáculos.'
WHERE id_mission='mis-c001-v2-14' AND id_activity='act-c001-14' AND objective='Guía el haz blue hasta el receptor en el tablero 5×5, usando espejos y filtros del mismo color.'
    AND EXISTS(SELECT 1 FROM activities a WHERE a.id_activity=activity_missions.id_activity AND a.level_template='neonflow-v3-14');
UPDATE activities SET level_template='neonflow-v3-15',
    description=CASE WHEN description='Guía el haz red hasta el receptor en el tablero 5×5, usando espejos y filtros del mismo color.' THEN 'Guía el haz rojo hasta el receptor en el tablero 5×5. Encadena giros para rodear los obstáculos.' ELSE description END
WHERE id_activity='act-c001-15' AND environment='neonflow' AND level_template='neonflow-v2-15'
    AND EXISTS(SELECT 1 FROM lessons l JOIN modules m ON m.id_module=l.id_module WHERE l.id_lesson=activities.id_lesson AND m.id_course='c001');
UPDATE activity_missions SET objective='Guía el haz rojo hasta el receptor en el tablero 5×5. Encadena giros para rodear los obstáculos.'
WHERE id_mission='mis-c001-v2-15' AND id_activity='act-c001-15' AND objective='Guía el haz red hasta el receptor en el tablero 5×5, usando espejos y filtros del mismo color.'
    AND EXISTS(SELECT 1 FROM activities a WHERE a.id_activity=activity_missions.id_activity AND a.level_template='neonflow-v3-15');
UPDATE activities SET level_template='neonflow-v3-16',
    description=CASE WHEN description='Guía el haz green hasta el receptor en el tablero 5×5, usando espejos y filtros del mismo color.' THEN 'Guía el haz verde hasta el receptor en el tablero 5×5. Encadena giros para rodear los obstáculos.' ELSE description END
WHERE id_activity='act-c001-16' AND environment='neonflow' AND level_template='neonflow-v2-16'
    AND EXISTS(SELECT 1 FROM lessons l JOIN modules m ON m.id_module=l.id_module WHERE l.id_lesson=activities.id_lesson AND m.id_course='c001');
UPDATE activity_missions SET objective='Guía el haz verde hasta el receptor en el tablero 5×5. Encadena giros para rodear los obstáculos.'
WHERE id_mission='mis-c001-v2-16' AND id_activity='act-c001-16' AND objective='Guía el haz green hasta el receptor en el tablero 5×5, usando espejos y filtros del mismo color.'
    AND EXISTS(SELECT 1 FROM activities a WHERE a.id_activity=activity_missions.id_activity AND a.level_template='neonflow-v3-16');
UPDATE activities SET level_template='neonflow-v3-17',
    description=CASE WHEN description='Guía el haz blue hasta el receptor en el tablero 5×5, usando espejos y filtros del mismo color.' THEN 'Guía el haz azul hasta el receptor en el tablero 5×5. Encadena giros para rodear los obstáculos.' ELSE description END
WHERE id_activity='act-c001-17' AND environment='neonflow' AND level_template='neonflow-v2-17'
    AND EXISTS(SELECT 1 FROM lessons l JOIN modules m ON m.id_module=l.id_module WHERE l.id_lesson=activities.id_lesson AND m.id_course='c001');
UPDATE activity_missions SET objective='Guía el haz azul hasta el receptor en el tablero 5×5. Encadena giros para rodear los obstáculos.'
WHERE id_mission='mis-c001-v2-17' AND id_activity='act-c001-17' AND objective='Guía el haz blue hasta el receptor en el tablero 5×5, usando espejos y filtros del mismo color.'
    AND EXISTS(SELECT 1 FROM activities a WHERE a.id_activity=activity_missions.id_activity AND a.level_template='neonflow-v3-17');
UPDATE activities SET level_template='neonflow-v3-18',
    description=CASE WHEN description='Guía el haz red hasta el receptor en el tablero 5×5, usando espejos y filtros del mismo color.' THEN 'Guía el haz rojo hasta el receptor en el tablero 5×5. Encadena giros para rodear los obstáculos.' ELSE description END
WHERE id_activity='act-c001-18' AND environment='neonflow' AND level_template='neonflow-v2-18'
    AND EXISTS(SELECT 1 FROM lessons l JOIN modules m ON m.id_module=l.id_module WHERE l.id_lesson=activities.id_lesson AND m.id_course='c001');
UPDATE activity_missions SET objective='Guía el haz rojo hasta el receptor en el tablero 5×5. Encadena giros para rodear los obstáculos.'
WHERE id_mission='mis-c001-v2-18' AND id_activity='act-c001-18' AND objective='Guía el haz red hasta el receptor en el tablero 5×5, usando espejos y filtros del mismo color.'
    AND EXISTS(SELECT 1 FROM activities a WHERE a.id_activity=activity_missions.id_activity AND a.level_template='neonflow-v3-18');
UPDATE activities SET level_template='neonflow-v3-19',
    description=CASE WHEN description='Guía el haz green hasta el receptor en el tablero 5×5, usando espejos y filtros del mismo color.' THEN 'Guía el haz verde hasta el receptor en el tablero 5×5. Encadena giros para rodear los obstáculos.' ELSE description END
WHERE id_activity='act-c001-19' AND environment='neonflow' AND level_template='neonflow-v2-19'
    AND EXISTS(SELECT 1 FROM lessons l JOIN modules m ON m.id_module=l.id_module WHERE l.id_lesson=activities.id_lesson AND m.id_course='c001');
UPDATE activity_missions SET objective='Guía el haz verde hasta el receptor en el tablero 5×5. Encadena giros para rodear los obstáculos.'
WHERE id_mission='mis-c001-v2-19' AND id_activity='act-c001-19' AND objective='Guía el haz green hasta el receptor en el tablero 5×5, usando espejos y filtros del mismo color.'
    AND EXISTS(SELECT 1 FROM activities a WHERE a.id_activity=activity_missions.id_activity AND a.level_template='neonflow-v3-19');
UPDATE activities SET level_template='neonflow-v3-20',
    description=CASE WHEN description='Guía el haz blue hasta el receptor en el tablero 5×5, usando espejos y filtros del mismo color.' THEN 'Guía el haz azul hasta el receptor en el tablero 5×5. Encadena giros para rodear los obstáculos.' ELSE description END
WHERE id_activity='act-c001-20' AND environment='neonflow' AND level_template='neonflow-v2-20'
    AND EXISTS(SELECT 1 FROM lessons l JOIN modules m ON m.id_module=l.id_module WHERE l.id_lesson=activities.id_lesson AND m.id_course='c001');
UPDATE activity_missions SET objective='Guía el haz azul hasta el receptor en el tablero 5×5. Encadena giros para rodear los obstáculos.'
WHERE id_mission='mis-c001-v2-20' AND id_activity='act-c001-20' AND objective='Guía el haz blue hasta el receptor en el tablero 5×5, usando espejos y filtros del mismo color.'
    AND EXISTS(SELECT 1 FROM activities a WHERE a.id_activity=activity_missions.id_activity AND a.level_template='neonflow-v3-20');
UPDATE activities SET level_template='neonflow-v3-21',
    description=CASE WHEN description='Guía el haz red hasta el receptor en el tablero 6×6, usando espejos y filtros del mismo color.' THEN 'Guía el haz rojo hasta el receptor en el tablero 6×6. Encadena giros para rodear los obstáculos.' ELSE description END
WHERE id_activity='act-c001-21' AND environment='neonflow' AND level_template='neonflow-v2-21'
    AND EXISTS(SELECT 1 FROM lessons l JOIN modules m ON m.id_module=l.id_module WHERE l.id_lesson=activities.id_lesson AND m.id_course='c001');
UPDATE activity_missions SET objective='Guía el haz rojo hasta el receptor en el tablero 6×6. Encadena giros para rodear los obstáculos.'
WHERE id_mission='mis-c001-v2-21' AND id_activity='act-c001-21' AND objective='Guía el haz red hasta el receptor en el tablero 6×6, usando espejos y filtros del mismo color.'
    AND EXISTS(SELECT 1 FROM activities a WHERE a.id_activity=activity_missions.id_activity AND a.level_template='neonflow-v3-21');
UPDATE activities SET level_template='neonflow-v3-22',
    description=CASE WHEN description='Guía el haz green hasta el receptor en el tablero 6×6, usando espejos y filtros del mismo color.' THEN 'Guía el haz verde hasta el receptor en el tablero 6×6. Encadena giros para rodear los obstáculos.' ELSE description END
WHERE id_activity='act-c001-22' AND environment='neonflow' AND level_template='neonflow-v2-22'
    AND EXISTS(SELECT 1 FROM lessons l JOIN modules m ON m.id_module=l.id_module WHERE l.id_lesson=activities.id_lesson AND m.id_course='c001');
UPDATE activity_missions SET objective='Guía el haz verde hasta el receptor en el tablero 6×6. Encadena giros para rodear los obstáculos.'
WHERE id_mission='mis-c001-v2-22' AND id_activity='act-c001-22' AND objective='Guía el haz green hasta el receptor en el tablero 6×6, usando espejos y filtros del mismo color.'
    AND EXISTS(SELECT 1 FROM activities a WHERE a.id_activity=activity_missions.id_activity AND a.level_template='neonflow-v3-22');
UPDATE activities SET level_template='neonflow-v3-23',
    description=CASE WHEN description='Guía el haz blue hasta el receptor en el tablero 6×6, usando espejos y filtros del mismo color.' THEN 'Guía el haz azul hasta el receptor en el tablero 6×6. Encadena giros para rodear los obstáculos.' ELSE description END
WHERE id_activity='act-c001-23' AND environment='neonflow' AND level_template='neonflow-v2-23'
    AND EXISTS(SELECT 1 FROM lessons l JOIN modules m ON m.id_module=l.id_module WHERE l.id_lesson=activities.id_lesson AND m.id_course='c001');
UPDATE activity_missions SET objective='Guía el haz azul hasta el receptor en el tablero 6×6. Encadena giros para rodear los obstáculos.'
WHERE id_mission='mis-c001-v2-23' AND id_activity='act-c001-23' AND objective='Guía el haz blue hasta el receptor en el tablero 6×6, usando espejos y filtros del mismo color.'
    AND EXISTS(SELECT 1 FROM activities a WHERE a.id_activity=activity_missions.id_activity AND a.level_template='neonflow-v3-23');
UPDATE activities SET level_template='neonflow-v3-24',
    description=CASE WHEN description='Guía el haz red hasta el receptor en el tablero 6×6, usando espejos y filtros del mismo color.' THEN 'Guía el haz rojo hasta el receptor en el tablero 6×6. Encadena giros para rodear los obstáculos.' ELSE description END
WHERE id_activity='act-c001-24' AND environment='neonflow' AND level_template='neonflow-v2-24'
    AND EXISTS(SELECT 1 FROM lessons l JOIN modules m ON m.id_module=l.id_module WHERE l.id_lesson=activities.id_lesson AND m.id_course='c001');
UPDATE activity_missions SET objective='Guía el haz rojo hasta el receptor en el tablero 6×6. Encadena giros para rodear los obstáculos.'
WHERE id_mission='mis-c001-v2-24' AND id_activity='act-c001-24' AND objective='Guía el haz red hasta el receptor en el tablero 6×6, usando espejos y filtros del mismo color.'
    AND EXISTS(SELECT 1 FROM activities a WHERE a.id_activity=activity_missions.id_activity AND a.level_template='neonflow-v3-24');
UPDATE activities SET level_template='neonflow-v3-25',
    description=CASE WHEN description='Guía el haz green hasta el receptor en el tablero 6×6, usando espejos y filtros del mismo color.' THEN 'Guía el haz verde hasta el receptor en el tablero 6×6. Encadena giros para rodear los obstáculos.' ELSE description END
WHERE id_activity='act-c001-25' AND environment='neonflow' AND level_template='neonflow-v2-25'
    AND EXISTS(SELECT 1 FROM lessons l JOIN modules m ON m.id_module=l.id_module WHERE l.id_lesson=activities.id_lesson AND m.id_course='c001');
UPDATE activity_missions SET objective='Guía el haz verde hasta el receptor en el tablero 6×6. Encadena giros para rodear los obstáculos.'
WHERE id_mission='mis-c001-v2-25' AND id_activity='act-c001-25' AND objective='Guía el haz green hasta el receptor en el tablero 6×6, usando espejos y filtros del mismo color.'
    AND EXISTS(SELECT 1 FROM activities a WHERE a.id_activity=activity_missions.id_activity AND a.level_template='neonflow-v3-25');
UPDATE activities SET level_template='neonflow-v3-26',
    description=CASE WHEN description='Guía el haz blue hasta el receptor en el tablero 6×6, usando espejos y filtros del mismo color.' THEN 'Guía el haz azul hasta el receptor en el tablero 6×6. Encadena giros para rodear los obstáculos.' ELSE description END
WHERE id_activity='act-c001-26' AND environment='neonflow' AND level_template='neonflow-v2-26'
    AND EXISTS(SELECT 1 FROM lessons l JOIN modules m ON m.id_module=l.id_module WHERE l.id_lesson=activities.id_lesson AND m.id_course='c001');
UPDATE activity_missions SET objective='Guía el haz azul hasta el receptor en el tablero 6×6. Encadena giros para rodear los obstáculos.'
WHERE id_mission='mis-c001-v2-26' AND id_activity='act-c001-26' AND objective='Guía el haz blue hasta el receptor en el tablero 6×6, usando espejos y filtros del mismo color.'
    AND EXISTS(SELECT 1 FROM activities a WHERE a.id_activity=activity_missions.id_activity AND a.level_template='neonflow-v3-26');
UPDATE activities SET level_template='neonflow-v3-27',
    description=CASE WHEN description='Guía el haz red hasta el receptor en el tablero 6×6, usando espejos y filtros del mismo color.' THEN 'Guía el haz rojo hasta el receptor en el tablero 6×6. Encadena giros para rodear los obstáculos.' ELSE description END
WHERE id_activity='act-c001-27' AND environment='neonflow' AND level_template='neonflow-v2-27'
    AND EXISTS(SELECT 1 FROM lessons l JOIN modules m ON m.id_module=l.id_module WHERE l.id_lesson=activities.id_lesson AND m.id_course='c001');
UPDATE activity_missions SET objective='Guía el haz rojo hasta el receptor en el tablero 6×6. Encadena giros para rodear los obstáculos.'
WHERE id_mission='mis-c001-v2-27' AND id_activity='act-c001-27' AND objective='Guía el haz red hasta el receptor en el tablero 6×6, usando espejos y filtros del mismo color.'
    AND EXISTS(SELECT 1 FROM activities a WHERE a.id_activity=activity_missions.id_activity AND a.level_template='neonflow-v3-27');
UPDATE activities SET level_template='neonflow-v3-28',
    description=CASE WHEN description='Guía el haz green hasta el receptor en el tablero 6×6, usando espejos y filtros del mismo color.' THEN 'Guía el haz verde hasta el receptor en el tablero 6×6. Encadena giros para rodear los obstáculos.' ELSE description END
WHERE id_activity='act-c001-28' AND environment='neonflow' AND level_template='neonflow-v2-28'
    AND EXISTS(SELECT 1 FROM lessons l JOIN modules m ON m.id_module=l.id_module WHERE l.id_lesson=activities.id_lesson AND m.id_course='c001');
UPDATE activity_missions SET objective='Guía el haz verde hasta el receptor en el tablero 6×6. Encadena giros para rodear los obstáculos.'
WHERE id_mission='mis-c001-v2-28' AND id_activity='act-c001-28' AND objective='Guía el haz green hasta el receptor en el tablero 6×6, usando espejos y filtros del mismo color.'
    AND EXISTS(SELECT 1 FROM activities a WHERE a.id_activity=activity_missions.id_activity AND a.level_template='neonflow-v3-28');
UPDATE activities SET level_template='neonflow-v3-29',
    description=CASE WHEN description='Guía el haz blue hasta el receptor en el tablero 6×6, usando espejos y filtros del mismo color.' THEN 'Guía el haz azul hasta el receptor en el tablero 6×6. Encadena giros para rodear los obstáculos.' ELSE description END
WHERE id_activity='act-c001-29' AND environment='neonflow' AND level_template='neonflow-v2-29'
    AND EXISTS(SELECT 1 FROM lessons l JOIN modules m ON m.id_module=l.id_module WHERE l.id_lesson=activities.id_lesson AND m.id_course='c001');
UPDATE activity_missions SET objective='Guía el haz azul hasta el receptor en el tablero 6×6. Encadena giros para rodear los obstáculos.'
WHERE id_mission='mis-c001-v2-29' AND id_activity='act-c001-29' AND objective='Guía el haz blue hasta el receptor en el tablero 6×6, usando espejos y filtros del mismo color.'
    AND EXISTS(SELECT 1 FROM activities a WHERE a.id_activity=activity_missions.id_activity AND a.level_template='neonflow-v3-29');
UPDATE activities SET level_template='neonflow-v3-30',
    description=CASE WHEN description='Guía el haz red hasta el receptor en el tablero 6×6, usando espejos y filtros del mismo color.' THEN 'Guía el haz rojo hasta el receptor en el tablero 6×6. Encadena giros para rodear los obstáculos.' ELSE description END
WHERE id_activity='act-c001-30' AND environment='neonflow' AND level_template='neonflow-v2-30'
    AND EXISTS(SELECT 1 FROM lessons l JOIN modules m ON m.id_module=l.id_module WHERE l.id_lesson=activities.id_lesson AND m.id_course='c001');
UPDATE activity_missions SET objective='Guía el haz rojo hasta el receptor en el tablero 6×6. Encadena giros para rodear los obstáculos.'
WHERE id_mission='mis-c001-v2-30' AND id_activity='act-c001-30' AND objective='Guía el haz red hasta el receptor en el tablero 6×6, usando espejos y filtros del mismo color.'
    AND EXISTS(SELECT 1 FROM activities a WHERE a.id_activity=activity_missions.id_activity AND a.level_template='neonflow-v3-30');
