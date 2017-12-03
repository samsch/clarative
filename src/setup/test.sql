/*
SELECT
    tc.constraint_name, tc.table_name, kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM
  information_schema.columns AS c
  JOIN information_schema.table_constraints AS tc
    ON c.column_name = kcu.
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name;
WHERE constraint_type IS NULL OR constraint_type = 'FOREIGN KEY';

select
  "table_name",
  column_name,
  data_type,
  column_default
from INFORMATION_SCHEMA.COLUMNS
where table_schema = 'public';*/

SELECT
  c.table_name, c.column_name, c.data_type, c.column_default,
  tc.constraint_name, tc.constraint_type,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM
  information_schema.columns AS c
  LEFT JOIN information_schema.key_column_usage AS kcu
    ON c.table_name = kcu.table_name and c.column_name = kcu.column_name
  LEFT JOIN information_schema.table_constraints AS tc
    ON tc.constraint_name = kcu.constraint_name
  LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE c.table_schema = 'public';
