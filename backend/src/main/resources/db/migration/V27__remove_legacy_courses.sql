-- Retain only the official simulator courses. Child curriculum rows cascade safely.
DELETE FROM courses
WHERE id_course NOT IN ('c001', 'c002');
