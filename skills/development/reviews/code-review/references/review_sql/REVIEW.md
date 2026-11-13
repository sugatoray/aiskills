# SQL review

What to look for in SQL, beyond `../CROSS_LANGUAGE.md`: queries, views, functions and procedures,
schema definitions and migrations, in `.sql` files and embedded in application code or ORM calls.
SQL fails differently from other code: a wrong query still returns rows, a slow one works in
development, and a migration that passes on a test database can lock production. `PATTERNS.md` has
the fix for the common items, `TOOLING.md` the commands, `SECURITY.md` the security scope, and
`WISDOM.md` the constraints and traps to keep in mind for every review.

## Before you start

- **Which engine and version.** PostgreSQL, MySQL/MariaDB, SQL Server, SQLite, Oracle,
  BigQuery, Snowflake and others differ in syntax, types, locking, default isolation and what
  DDL blocks. Find it from the driver, connection string, migration tool config, CI services or
  `docker-compose`. Don't suggest syntax the engine lacks, and say which engine a finding
  assumes when behaviour differs.
- **What kind of SQL.** Application queries (latency, concurrency, injection), a migration
  (locking, compatibility with running code, reversibility), analytics or reporting
  (correctness of joins and aggregates, cost), or stored logic (error handling, privileges).
- **Sizes and load.** Row counts of the tables touched, their growth, and how often the
  statement runs. A sequential scan on 500 rows is fine; on 500 million it is an outage. If you
  can't find out, ask, and state the size you assumed.
- **How the schema is managed.** Migration tool (Flyway, Liquibase, Alembic, Rails, Prisma,
  dbmate, sqitch), naming and ordering conventions, whether migrations run in a transaction,
  whether there is a down path.
- **Read the schema** for every table a query touches: column types, nullability, keys,
  indexes, constraints. Most findings below can't be judged from the query text alone.

## Correctness

- **`NULL` is not a value.** `x = NULL` and `x <> NULL` are never true (use `IS NULL` /
  `IS NOT NULL`, or `IS DISTINCT FROM` where supported). `x <> 'a'` and `NOT (x = 'a')`
  exclude rows where `x` is null. `NULL` in arithmetic or concatenation makes the result null
  (`||` in PostgreSQL and Oracle differ here).
- **`NOT IN` with a subquery that can return `NULL`** returns no rows at all. Use
  `NOT EXISTS`.
- **Aggregates and `NULL`:** `COUNT(col)` skips nulls, `COUNT(*)` doesn't; `SUM`, `AVG`,
  `MIN`, `MAX` over no rows return `NULL`, not 0 (wrap in `COALESCE`); `AVG` ignores null rows
  in its denominator.
- **Join fan-out.** Joining a parent to two child tables, or to a child with several matching
  rows, multiplies rows; a following `SUM`/`COUNT` is inflated. `DISTINCT` or `GROUP BY` added
  to "fix duplicates" usually hides this. Aggregate each child in its own subquery or CTE
  before joining, or use `EXISTS` when only existence matters.
- **An outer join turned into an inner join** by a `WHERE` condition on the outer table
  (`LEFT JOIN b … WHERE b.status = 'x'`). The condition belongs in `ON`, or the join was meant
  to be inner.
- **Missing or wrong join condition:** a join with no `ON` (cross join), on the wrong
  column, or on only part of a composite key. Comma joins hide this; require explicit `JOIN …
  ON`.
- **`GROUP BY` that doesn't cover the selected columns.** MySQL without `ONLY_FULL_GROUP_BY`
  and SQLite return an arbitrary row's value for a column that is neither grouped nor
  aggregated.
- **Ranges on timestamps.** `BETWEEN '2024-01-01' AND '2024-01-31'` stops at midnight at the
  start of the 31st; `BETWEEN` is inclusive at both ends, so adjacent ranges double-count the
  boundary. Use half-open ranges: `>= start AND < next_start`.
- **Time zones.** `timestamp without time zone` holding local times, compared with `now()`
  or grouped by day without stating the zone; date truncation in the server's zone for users
  elsewhere. Store instants in a zone-aware type (`timestamptz`, `datetimeoffset`) or in UTC by
  convention, and convert at the edge.
- **`LIMIT`/`TOP`/`FETCH FIRST` without a deterministic `ORDER BY`.** The rows returned are
  arbitrary and can change between runs. Ties in the `ORDER BY` do the same to pagination: add
  a unique column as the last sort key.
- **`UNION` where `UNION ALL` is meant** (silently removes duplicate rows, and sorts or
  hashes to do it), or the reverse.
- **Types.** Integer division (`1/2` is 0 in PostgreSQL, SQL Server and SQLite); `FLOAT`/
  `REAL`/`DOUBLE` for money (use `NUMERIC`/`DECIMAL`); implicit conversion when comparing a
  string column with a number or the reverse (wrong results in MySQL, a full scan elsewhere);
  `CHAR(n)` padding; silent truncation on insert in MySQL without strict mode.
- **Text comparison:** case sensitivity and trailing-space behaviour depend on engine and
  collation; `LIKE` treats `%` and `_` in user input as wildcards (escape them).
- **Window functions.** With `ORDER BY` and no frame clause the default frame ends at the
  current row (`RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`), so `LAST_VALUE` returns
  the current row and running totals include all peers with the same sort value. `ROW_NUMBER`
  over a non-unique order is nondeterministic.
- **`UPDATE` or `DELETE` with no `WHERE`,** or with a `WHERE` that depends on a join the
  statement doesn't restrict correctly (`UPDATE … FROM` with a missing join condition updates
  every row).
- **`INSERT` without a column list,** and `SELECT *` in views, `INSERT … SELECT`, or
  application code that reads columns by position: the statement breaks, or silently shifts
  values, when a column is added or reordered.
- **Subqueries that must return one row** but aren't guaranteed to (`= (SELECT …)`): an
  error at run time, or in some engines an arbitrary row.
- **Empty and duplicate inputs:** `IN ()` with an empty list generated by code (a syntax
  error in most engines); `MERGE`/upsert sources with duplicate keys.
- **Soft deletes and tenancy filters** (`deleted_at IS NULL`, `tenant_id = ?`) missing from
  one of the joined tables or one branch of a `UNION`.

## Security

Read `SECURITY.md` for the full scope; it is part of every full review. The items that most
often matter in ordinary review: statements assembled from strings (in application code, ORM
escape hatches and dynamic SQL), identifiers taken from input, over-broad grants,
`SECURITY DEFINER` without a fixed `search_path`, a missing tenant or owner predicate, and
sensitive data or credentials in seed and migration files.

## Performance

Give evidence: the query plan, the row counts, or at least the reasoning from the schema.

- **Predicates that can't use an index.** A function or cast on the column
  (`WHERE DATE(created_at) = …`, `LOWER(email) = …`, `col::text = …`), arithmetic on it
  (`col + 1 = …`), a leading wildcard (`LIKE '%x'`), an implicit type conversion, or `OR`
  across different columns. Rewrite so the bare column is compared (a range instead of
  `DATE()`), or add an expression index.
- **Missing indexes** for the columns in `JOIN … ON`, `WHERE`, and `ORDER BY` of frequent
  queries, and for foreign-key columns: PostgreSQL, SQL Server and Oracle don't index the
  referencing side automatically (InnoDB does), which makes deletes and updates on the parent
  scan the child.
- **Composite index column order** that doesn't match the query: equality columns first,
  then the range or sort column; a query that skips the leading column can't use it well.
- **Too many or redundant indexes** on a write-heavy table (an index on `(a)` beside one on
  `(a, b)`); an index added in the change with no query that needs it.
- **N+1 from the application:** one query per row of a previous result. Fetch with a join,
  `IN`/`= ANY`, or a batch.
- **`SELECT *`** pulling wide or large columns (`TEXT`, `JSON`, `BLOB`) that aren't used,
  and defeating covering indexes.
- **`OFFSET` pagination deep into a large result:** the engine reads and discards every
  skipped row. Use keyset pagination (`WHERE (sort_key, id) > (?, ?) ORDER BY … LIMIT n`).
- **Correlated subqueries evaluated per row,** scalar subqueries in the select list, and
  functions called per row, where a join, a window function or one grouped subquery would do.
- **`COUNT(*)` to test existence** (`IF (SELECT COUNT(*) …) > 0`): use `EXISTS`, which stops
  at the first row.
- **`DISTINCT`, `ORDER BY`, `GROUP BY`, `UNION`** on large intermediate results that don't
  need them; sorting without a supporting index on a hot path.
- **Large `IN` lists** (thousands of literals) and large multi-row statements: use a
  temporary table, an array parameter or a join.
- **CTEs.** PostgreSQL before 12 always materialises a CTE (an optimisation fence); from 12
  it inlines one that is referenced once and has no side effects, unless marked
  `MATERIALIZED`. A CTE referenced several times is computed once and can't push predicates
  down. Other engines differ again.
- **One huge `UPDATE`/`DELETE`:** a long transaction, lock contention, replication lag,
  bloated logs. Batch by key range with a commit per batch.
- **Analytic warehouses (BigQuery, Snowflake, Redshift):** no partition or cluster filter
  (full-table scan billed by bytes), `SELECT *` on wide tables, cross joins, repeated scans of
  the same table that one pass with conditional aggregation would cover.

## Transactions and concurrency

- **Several statements that must succeed or fail together, with no transaction,** or with
  the application committing between them.
- **Read-then-write races.** `SELECT` a value, decide in the application, then `UPDATE`:
  two sessions both read the old value. Do it in one statement
  (`UPDATE … SET n = n - 1 WHERE id = ? AND n > 0`, then check the row count), lock the row
  (`SELECT … FOR UPDATE`), or use an optimistic version column.
- **Check-then-insert.** "Insert if it doesn't exist" by `SELECT` then `INSERT` inserts
  twice under concurrency. Rely on a unique constraint plus an upsert
  (`INSERT … ON CONFLICT`, `ON DUPLICATE KEY UPDATE`, `MERGE` with care).
- **Assumptions about isolation.** Defaults differ: READ COMMITTED in PostgreSQL, SQL Server
  and Oracle; REPEATABLE READ in MySQL InnoDB. Under READ COMMITTED each statement sees a new
  snapshot, so two reads in one transaction can disagree. Code that needs more must ask for it
  and retry on serialisation failures and deadlocks.
- **Long transactions:** holding locks or an old snapshot across network calls, user
  interaction, or a large batch; idle-in-transaction connections blocking DDL and vacuum.
- **Lock order.** Two code paths updating the same tables or rows in different orders
  deadlock. Lock in a consistent order (for example by primary key).
- **Dirty reads on purpose:** `WITH (NOLOCK)` / READ UNCOMMITTED can return rows twice, skip
  rows, or read data that is rolled back. Not a performance setting.
- **Queue tables** polled without `FOR UPDATE SKIP LOCKED` (or the engine's equivalent): two
  workers take the same job.
- **Idempotency.** A statement or job that is retried (timeouts, at-least-once delivery)
  must not double-apply: use a unique key on the operation, or make the write absolute instead
  of relative.
- **Triggers and cascades** doing significant hidden work or locking inside the caller's
  transaction.

## Schema design

- **Constraints carry the invariants:** a primary key on every table; `NOT NULL` wherever
  absence is meaningless; `UNIQUE` on natural keys; foreign keys with an explicit `ON DELETE`
  action; `CHECK` for ranges and allowed values. An invariant enforced only in application
  code will be violated by the next script, job or service.
- **Types that fit the data:** `NUMERIC`/`DECIMAL` for money; zone-aware timestamps; a
  boolean type, not `'Y'`/`'N'`; `DATE` for dates, not strings; `BIGINT` (or UUID) keys for
  tables that will grow past 2 billion rows; `TEXT` with a `CHECK` rather than an arbitrary
  `VARCHAR(255)` in PostgreSQL; JSON columns only for data that is truly schemaless, not to
  avoid modelling.
- **Nullable columns with a default meaning** ("null means false", "null means not yet"),
  and three-valued booleans.
- **Denormalised or duplicated data** with nothing keeping the copies in step.
- **Polymorphic references** (`owner_type`, `owner_id`) and comma-separated lists or arrays of
  IDs: no foreign key can protect them.
- **Naming** consistent with the existing schema (singular or plural, `snake_case`,
  `_id`/`_at` suffixes); no reserved words as identifiers; no quoted mixed-case identifiers
  that then need quoting forever.
- **Audit columns** (`created_at`, `updated_at`) where the project uses them, with defaults
  set by the database.
- **Enumerations:** a native `ENUM` is hard to change (removing or reordering values); a
  lookup table or a `CHECK` is easier to evolve.

## Migrations

Treat every migration as running against the largest production table, under load, while the
old version of the application is still serving traffic.

- **Locks.** Many `ALTER TABLE` forms take a lock that blocks reads and writes for the
  duration, and even a quick one queues behind a long transaction and blocks everything behind
  it. Set a lock timeout (`SET lock_timeout`, `SET SESSION lock_wait_timeout`) and retry.
- **Building an index.** A plain `CREATE INDEX` blocks writes on PostgreSQL for the whole
  build: use `CREATE INDEX CONCURRENTLY` (which can't run inside a transaction block, and
  leaves an invalid index behind if it fails). MySQL (InnoDB online DDL) and SQL Server
  (`ONLINE = ON`, edition-dependent) have their own forms.
- **Adding a column.** `NOT NULL` with no default fails on a non-empty table. A default that
  must be computed per row (a volatile function), or any default on PostgreSQL before 11 and
  some MySQL versions, rewrites the whole table under lock. Add it nullable, backfill in
  batches, then add the constraint.
- **Adding constraints.** A foreign key or `CHECK` validates every existing row under lock.
  On PostgreSQL add it `NOT VALID`, then `VALIDATE CONSTRAINT` in a separate statement (which
  takes a weaker lock). `SET NOT NULL` scans the table unless a validated `CHECK (col IS NOT
  NULL)` already exists (PostgreSQL 12+).
- **Changing a column's type** usually rewrites the table and its indexes. Prefer a new
  column, a backfill, and a switch.
- **Renames and drops break running code.** During a rolling deploy the old application
  version still reads and writes the old name. Use expand and contract: add the new shape,
  write to both, backfill, move reads, then remove the old shape in a later release. Dropping a
  column that an ORM still selects fails every query on that table.
- **Data changes mixed with schema changes** in one migration, or a backfill of millions of
  rows in a single transaction: split them, batch the backfill, and make it resumable.
- **Transactions.** PostgreSQL DDL is transactional; MySQL commits implicitly at each DDL
  statement, so a migration that fails half-way stays half-applied; SQL Server and Oracle
  differ per statement. Know which applies and whether the tool wraps the file.
- **Reversibility:** a tested down migration, or an explicit statement that the change is
  one-way, with a backup or restore plan for destructive steps (`DROP`, `TRUNCATE`, lossy type
  changes).
- **Idempotency and ordering:** `IF NOT EXISTS`/`IF EXISTS` where the tool may re-run a file;
  a timestamp or sequence number that doesn't collide with a migration merged in parallel; an
  already-applied migration edited instead of a new one added.
- **Dependent objects:** views, functions, triggers, generated columns, replication
  publications and grants that refer to what is being changed.

## Stored procedures, functions and triggers

- Error handling: exceptions caught and discarded; `WHEN OTHERS THEN NULL`; in T-SQL, no
  `SET XACT_ABORT ON` and no `TRY…CATCH`, so a failed statement leaves a transaction open
  and the batch continues.
- Row-by-row loops and cursors where one set-based statement would do.
- Volatility and determinism declared wrongly (`IMMUTABLE` on a function that reads tables or
  the clock) leading to wrong cached or indexed results.
- Triggers with side effects that surprise callers, recurse, or assume one row per statement
  (SQL Server and statement-level triggers see many rows).
- `SET NOCOUNT`, `search_path`, session settings changed and not restored.
- Business logic duplicated between a procedure and application code.

## Readability

- Explicit `JOIN … ON`; every column qualified with a table alias when more than one table is
  involved; aliases that mean something (`o`, `c` for `orders`, `customers` is fine; `a`, `b`,
  `t1` isn't).
- CTEs or views to name the steps of a long query; one consistent layout (keywords, one
  clause per line) as the project's formatter gives it.
- `ORDER BY 1` and `GROUP BY 1, 2` in code that lasts: positions change when the select list
  does.
- Comments on business rules a reader can't infer (why this status is excluded, what the
  magic date is).
- No commented-out queries and no dead columns left behind.

## Tests

- Queries with non-trivial logic are tested against a real instance of the same engine with
  edge-case rows: nulls, no matches, duplicates, boundary dates, ties.
- Migrations are run up, and down where supported, against a copy with realistic volume, and
  timed.
- Constraints are tested by trying to violate them.
- The project's tools where present: `pgTAP`, `tSQLt`, `utPLSQL`, dbt tests, the ORM's test
  database.

## Usually not worth a finding

- Keyword case, comma position, indentation (the formatter's job).
- `!=` against `<>`; `COALESCE` against the engine's own `IFNULL`/`ISNULL`/`NVL` in code that
  targets one engine.
- A subquery against a join, when the plan is the same and both read clearly.
- `SELECT *` in an ad hoc query or inside `EXISTS (…)`.
