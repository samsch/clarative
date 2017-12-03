# Clarative

## TODO

Create UI interface for building RESTful routes and database definitions.

Ideally should be able to scan a DB for tables and import the definitions, as well as take a definition set and create DB tables.

DB Migrations will be left as an exercise for the user, Clarative will rely on importing the definitions after external changes are made.

```sql
select
  table_name,
  column_name,
  data_type,
  column_default,
  is_generated
from INFORMATION_SCHEMA.COLUMNS
where table_schema = 'public';
```
