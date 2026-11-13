# SQL tooling

Commands to run during a review, and how to read them. Follow `SKILL.md` step 4: run what the
project already has, don't install into it, and treat output as leads to confirm.

**Never run SQL under review against a production database, or any database you were not told
to use.** Use a local or disposable instance of the same engine and major version (the
project's `docker-compose`, a test container, a scratch schema), and never use credentials
found in the repository. `EXPLAIN ANALYZE` executes the statement: on a write, wrap it in a
transaction and roll back. If no safe database is available, review by reading and say so.

## Find what the project uses

```bash
git ls-files | grep -iE '(migrations?|db|sql|schema|alembic|flyway|liquibase|prisma)/' | head -40
ls alembic.ini flyway.conf liquibase.properties dbt_project.yml .sqlfluff sqlfluff.toml schema.sql db/schema.rb prisma/schema.prisma 2>/dev/null
git grep -nE 'image: *(postgres|mysql|mariadb|mcr.microsoft.com/mssql)' -- '*.yml' '*.yaml'   # engine and version
git grep -nE "(execute|query|raw|text)\((f[\"']|\`|[\"'][^\"']*[\"'] *[+%])" -- '*.py' '*.js' '*.ts' | head -40   # SQL built from strings
```

The last command is a rough net for SQL assembled by interpolation in application code;
confirm each hit by reading it.

## Checks

| Purpose | Command | Notes |
| --- | --- | --- |
| Lint and parse | `sqlfluff lint --dialect <dialect> path/` | Needs `sqlfluff`. Dialects include `postgres`, `mysql`, `tsql`, `sqlite`, `bigquery`, `snowflake`, `oracle`. Honours `.sqlfluff`. `sqlfluff parse` alone shows unparsable sections. Templated SQL (dbt, Jinja) needs the matching templater. |
| Migration safety (PostgreSQL) | `squawk path/to/migration.sql` | Needs `squawk`. Flags blocking DDL: index built without `CONCURRENTLY`, constraints added without `NOT VALID`, column type changes, `NOT NULL` additions. |
| Apply migrations to a scratch database | the project's tool: `alembic upgrade head`, `flyway migrate`, `rails db:migrate`, `prisma migrate deploy`, `dbmate up` | Then the down path if there is one, then up again. Time it against realistic data. |
| Run a file and stop at the first error | `psql -X -v ON_ERROR_STOP=1 -1 -f file.sql` (PostgreSQL; `-1` wraps it in one transaction), `mysql --show-warnings < file.sql`, `sqlcmd -b -i file.sql`, `sqlite3 -bail db < file.sql` | Without these flags the client carries on after an error. |
| Query plan | see "Reading a plan" below | The main evidence for a performance finding. |
| Schema as the database sees it | `psql -c '\d+ table'`, `SHOW CREATE TABLE t;` (MySQL), `sp_help 't'` (SQL Server), `.schema t` (SQLite) | Check indexes, constraints and types against what the query assumes. |
| Schema drift | `pg_dump --schema-only`, `mysqldump --no-data`, or the tool's diff (`alembic check`, `prisma migrate diff`, `atlas schema diff`) | Does the migrated schema match the models or the checked-in schema file? |
| Tests | `pg_prove` (pgTAP), `tSQLt.RunAll`, `dbt test`, or the application's tests against a test database | |

## Reading a plan

PostgreSQL:

```sql
BEGIN;
EXPLAIN (ANALYZE, BUFFERS, VERBOSE) <statement>;
ROLLBACK;
```

MySQL 8: `EXPLAIN ANALYZE <statement>;` (or `EXPLAIN FORMAT=TREE` to plan without running).
SQL Server: `SET STATISTICS IO, TIME ON;` and the actual execution plan. SQLite:
`EXPLAIN QUERY PLAN <statement>;`. BigQuery and Snowflake: a dry run or the query profile, for
bytes scanned and partitions pruned.

What to look for:

- **A sequential or full scan on a large table** where a filter or join should have used an
  index, and why: no index, a function or cast on the column, a type mismatch, low selectivity.
- **Estimated against actual rows.** A large gap (10x or more) means stale statistics or a
  predicate the planner can't estimate, and usually a bad join choice downstream.
- **"Rows Removed by Filter"** much larger than rows returned: the index doesn't cover the
  predicate.
- **Nested loops with a large outer side,** or an inner side executed many times (`loops=`).
- **Sorts and hashes spilling to disk** ("external merge", temp buffers).
- **The same table scanned several times** in one statement.

A plan from a small development database says little about production: note the row counts
you tested with. Without realistic data, argue from the schema (which index could serve this
predicate?) and mark the finding `likely` or `to verify`.

## Checking a migration's locks (PostgreSQL)

Run the migration in one session with a transaction left open, and in another:

```sql
SELECT l.locktype, l.mode, l.granted, c.relname
FROM pg_locks AS l
JOIN pg_class AS c ON c.oid = l.relation
WHERE c.relname = 'orders';
```

`AccessExclusiveLock` blocks reads and writes; `ShareLock` (plain `CREATE INDEX`) blocks
writes; `ShareUpdateExclusiveLock` (`CREATE INDEX CONCURRENTLY`, `VALIDATE CONSTRAINT`) blocks
neither. The PostgreSQL documentation's "Explicit Locking" table lists what each mode conflicts
with.

## Reproducing a finding

A few rows are enough to demonstrate a correctness finding. Include the edge case in the data:

```sql
BEGIN;
CREATE TEMP TABLE customers (id int PRIMARY KEY);
CREATE TEMP TABLE orders (id int PRIMARY KEY, customer_id int);
INSERT INTO customers VALUES (1), (2);
INSERT INTO orders VALUES (10, 1), (11, NULL);

SELECT id FROM customers WHERE id NOT IN (SELECT customer_id FROM orders);        -- no rows
SELECT id FROM customers AS c
WHERE NOT EXISTS (SELECT 1 FROM orders AS o WHERE o.customer_id = c.id);          -- 2
ROLLBACK;
```

For a concurrency finding, open two sessions and interleave the statements by hand; write the
interleaving into the report so the author can replay it.
