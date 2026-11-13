# SQL review wisdom

Read this before forming findings on SQL, in a full review and in a security-only one.
**Constraints** are limits the review must stay within. **Traps** are things in the language
that mislead a reader. **Ditches** are the ways a review of this language goes off the road.
**Wisdom** is the judgement that keeps it on.

## Constraints

- **The engine and its version bound every suggestion.** Syntax, locking, default isolation
  level, `NULL` ordering, identifier case and what DDL is transactional all differ. Never
  carry a PostgreSQL fact into a MySQL or SQL Server review unchecked.
- **Never run SQL under review against production,** or any database you were not told to
  use, and never with credentials found in the repository. `EXPLAIN ANALYZE` executes the
  statement.
- **A migration that has been applied anywhere is immutable.** The fix is a new migration,
  not an edit.
- **Old and new application code run at the same time during a deploy.** A schema change must
  work with both, which usually means expand, migrate, then contract.
- **Data volume is part of the specification.** A statement is reviewed against the size and
  write rate of the real table, not the development one.
- **A linter confirms that SQL parses,** not that it is correct, fast or safe to deploy.

## Traps

- **`NULL` is not a value.** `x = NULL` is never true; `NOT IN (…)` with a `NULL` in the list
  returns no rows; `count(col)` skips `NULL`s and `count(*)` does not; `NULL`s sort first or
  last depending on the engine.
- **`BETWEEN` is inclusive at both ends,** and a date literal compared with a timestamp means
  midnight, so `BETWEEN '2024-01-01' AND '2024-01-31'` misses most of the 31st.
- **A filter on the right-hand table of a `LEFT JOIN` placed in `WHERE` turns it into an
  inner join.** It belongs in `ON`.
- **Joining two one-to-many relations multiplies rows,** and `sum` and `count` over the
  result are inflated; `DISTINCT` hides the symptom, not the cause.
- **`AND` binds tighter than `OR`.** `WHERE a AND b OR c` is `(a AND b) OR c`.
- **`UNION` removes duplicates** (and sorts or hashes to do it); `UNION ALL` does not.
- **Without `ORDER BY` there is no order,** and `LIMIT` without a unique sort key returns
  different rows on different runs, so pages overlap or skip.
- **A function or implicit cast on an indexed column in a predicate** usually stops the
  index being used, as does a leading `%` in `LIKE`.
- **`timestamp` without time zone records no instant.** Mixed with `timestamptz`, values
  shift by the session's zone.
- **Read-then-write is a race** at the default isolation level in most engines: two
  transactions can both read the old value. Use one atomic statement, `SELECT … FOR UPDATE`,
  or a constraint.
- **`UPDATE` or `DELETE` without a `WHERE`** is valid and touches every row.
- **Integer division truncates** in most engines (`1 / 2` is `0`), and `float` columns do not
  hold money exactly.
- **DDL takes locks.** Adding a constraint, changing a type or building an index can block
  reads or writes for the duration on a large table; in MySQL and Oracle DDL also commits
  implicitly.
- **Identifier case folding differs:** unquoted names fold to lower case in PostgreSQL, upper
  in Oracle, and depend on the file system in MySQL.

## Ditches

- **Reviewing formatting and keyword case** while a migration that locks a hot table goes
  through.
- **Judging performance from the text.** Without a plan on realistic data, say "likely" and
  name the index that would or would not serve the predicate.
- **Judging a migration on an empty database.** It passes there by construction.
- **Demanding an index for every predicate.** Each index costs every write; ask what the
  query frequency and table size are.
- **Forgetting the down path, the back-fill and the deploy order:** how long it runs, what
  it locks, whether it can be re-run after failing half-way.
- **Reviewing the `.sql` file and missing the SQL in application code,** ORM calls and
  string constants, where most injection lives.
- **Trusting the ORM.** Read the SQL it generates for the changed call: N+1 queries, missing
  predicates and `SELECT *` hide there.
- **Treating "works in tests" as evidence** for concurrency, locking or volume behaviour.

## Wisdom

- **Let the database enforce what must always be true:** `NOT NULL`, `UNIQUE`, foreign keys
  and `CHECK` constraints hold under concurrency; application checks do not.
- **Bind every value; allow-list every identifier.**
- **Write the edge-case rows first:** a `NULL`, a duplicate, an empty set, a boundary
  timestamp. A handful of rows settles most correctness questions.
- **Prefer set-based statements to row-by-row loops,** and one round trip to many.
- **Make schema changes in small, reversible, backwards-compatible steps.**
- **Read the plan, with the row counts beside it.**
- **Give the application role the least it needs,** and keep migrations on a different one.
- **Half-open ranges** (`>= start AND < end`) are right for time more often than `BETWEEN`.
- **Say what you did not check:** the engine and version tested, the data size, the
  migrations not applied, the plans not read.
