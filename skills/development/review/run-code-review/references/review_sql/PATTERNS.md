# SQL fix patterns

Before/after pairs for the findings that come up most. Use them to shape a suggested change.
The SQL is PostgreSQL unless noted, with the main variants for other engines called out: check
the engine and version of the code under review, and adapt names and layout to its conventions.

## `NOT EXISTS` instead of `NOT IN`

```sql
-- Before: returns no rows at all if any orders.customer_id is NULL
SELECT c.id
FROM customers AS c
WHERE c.id NOT IN (SELECT o.customer_id FROM orders AS o);
```

```sql
-- After
SELECT c.id
FROM customers AS c
WHERE NOT EXISTS (
    SELECT 1
    FROM orders AS o
    WHERE o.customer_id = c.id
);
```

## Half-open date ranges on a bare column

```sql
-- Before: '2024-01-31' means midnight at the start of the 31st, so the rest of that day is missed
SELECT count(*)
FROM orders
WHERE created_at BETWEEN '2024-01-01' AND '2024-01-31';
```

```sql
-- Before: covers the whole month, but the function on the column rules out the index on created_at
SELECT count(*)
FROM orders
WHERE DATE(created_at) BETWEEN '2024-01-01' AND '2024-01-31';
```

```sql
-- After
SELECT count(*)
FROM orders
WHERE created_at >= '2024-01-01'
  AND created_at <  '2024-02-01';
```

## Aggregate before joining

```sql
-- Before: each order row is repeated once per payment, so order totals are inflated
SELECT c.id,
       sum(o.total)  AS ordered,
       sum(p.amount) AS paid
FROM customers AS c
LEFT JOIN orders   AS o ON o.customer_id = c.id
LEFT JOIN payments AS p ON p.customer_id = c.id
GROUP BY c.id;
```

```sql
-- After: one row per customer from each child before the join
WITH order_totals AS (
    SELECT customer_id, sum(total) AS ordered
    FROM orders
    GROUP BY customer_id
),
payment_totals AS (
    SELECT customer_id, sum(amount) AS paid
    FROM payments
    GROUP BY customer_id
)
SELECT c.id,
       coalesce(ot.ordered, 0) AS ordered,
       coalesce(pt.paid, 0)    AS paid
FROM customers AS c
LEFT JOIN order_totals   AS ot ON ot.customer_id = c.id
LEFT JOIN payment_totals AS pt ON pt.customer_id = c.id;
```

## Keep an outer join outer

```sql
-- Before: the WHERE removes customers with no orders, so this is an inner join
SELECT c.id, o.id AS order_id
FROM customers AS c
LEFT JOIN orders AS o ON o.customer_id = c.id
WHERE o.status = 'open';
```

```sql
-- After: the filter is part of the join condition
SELECT c.id, o.id AS order_id
FROM customers AS c
LEFT JOIN orders AS o
       ON o.customer_id = c.id
      AND o.status = 'open';
```

## Bound parameters

```sql
-- Before (application code): 'SELECT … WHERE email = ''' + email + ''''
SELECT id, email FROM users WHERE email = 'alice@example.com';
```

```sql
-- After: the value travels separately from the statement ($1, ?, :email or @email per driver)
SELECT id, email FROM users WHERE email = $1;
```

Dynamic SQL inside a PostgreSQL function, with an identifier and a value:

```sql
-- Before: both parts are injectable
EXECUTE 'SELECT count(*) FROM ' || table_name || ' WHERE owner = ''' || owner_name || '''' INTO n;
```

```sql
-- After: %I quotes the identifier; the value is bound with USING
EXECUTE format('SELECT count(*) FROM %I WHERE owner = $1', table_name)
   INTO n
  USING owner_name;
```

SQL Server: `QUOTENAME(@table)` for the identifier and
`EXEC sp_executesql @sql, N'@owner sysname', @owner = @owner;` for the value.

## Upsert instead of check-then-insert

```sql
-- Before: two sessions can both find no row and both insert
SELECT 1 FROM subscriptions WHERE user_id = $1 AND plan = $2;
-- application: if no row was returned …
INSERT INTO subscriptions (user_id, plan, seats) VALUES ($1, $2, $3);
```

```sql
-- After: needs UNIQUE (user_id, plan)
INSERT INTO subscriptions (user_id, plan, seats)
VALUES ($1, $2, $3)
ON CONFLICT (user_id, plan)
DO UPDATE SET seats = EXCLUDED.seats;
```

MySQL: `INSERT … ON DUPLICATE KEY UPDATE seats = VALUES(seats)`. SQL Server: `MERGE … WITH
(HOLDLOCK)`, or `UPDATE` then `INSERT` inside a serializable transaction.

## Atomic decrement

```sql
-- Before: two sessions read stock = 1 and both write 0
SELECT stock FROM products WHERE id = $1;
-- application: if stock >= quantity …
UPDATE products SET stock = $2 WHERE id = $1;
```

```sql
-- After: one statement; zero rows updated means not enough stock
UPDATE products
SET stock = stock - $2
WHERE id = $1
  AND stock >= $2;
```

When the decision needs more than one statement, lock the row first:
`SELECT stock FROM products WHERE id = $1 FOR UPDATE;` inside the transaction.

## Keyset pagination

```sql
-- Before: reads and discards 100,000 rows; rows shift between pages as data changes
SELECT id, created_at, title
FROM posts
ORDER BY created_at DESC
LIMIT 20 OFFSET 100000;
```

```sql
-- After: $1, $2 are created_at and id of the last row of the previous page
SELECT id, created_at, title
FROM posts
WHERE (created_at, id) < ($1, $2)
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

Needs an index on `(created_at DESC, id DESC)`. Engines without row-value comparison (SQL
Server): `WHERE created_at < @t OR (created_at = @t AND id < @id)`.

## Deterministic "latest row per group"

```sql
-- Before: which row wins a tie on created_at is arbitrary
SELECT DISTINCT ON (user_id) user_id, id, created_at
FROM logins
ORDER BY user_id, created_at DESC;
```

```sql
-- After: a unique tie-breaker; this form also works in MySQL 8, SQL Server and Oracle
SELECT user_id, id, created_at
FROM (
    SELECT user_id, id, created_at,
           row_number() OVER (PARTITION BY user_id ORDER BY created_at DESC, id DESC) AS rn
    FROM logins
) AS ranked
WHERE rn = 1;
```

## `EXISTS` instead of counting

```sql
-- Before: counts every matching row to learn whether there is one
SELECT count(*) > 0 AS has_open_orders FROM orders WHERE customer_id = $1 AND status = 'open';
```

```sql
-- After: stops at the first match
SELECT EXISTS (
    SELECT 1 FROM orders WHERE customer_id = $1 AND status = 'open'
) AS has_open_orders;
```

## One query instead of one per row

```sql
-- Before (application loop): run once for every order on the page
SELECT id, name FROM customers WHERE id = $1;
```

```sql
-- After: one round trip for the whole page ($1 is an array of ids)
SELECT id, name FROM customers WHERE id = ANY($1);
```

Other engines: `WHERE id IN (?, ?, …)` with one placeholder per value, or a join to a
table-valued parameter or temporary table.

## Explicit window frame

```sql
-- Before: the default frame ends at the current row, so last_value is the current row's value
SELECT id, amount,
       last_value(amount) OVER (PARTITION BY account_id ORDER BY created_at) AS latest_amount
FROM transactions;
```

```sql
-- After
SELECT id, amount,
       last_value(amount) OVER (
           PARTITION BY account_id
           ORDER BY created_at, id
           ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
       ) AS latest_amount
FROM transactions;
```

## Constraints in the table definition

```sql
-- Before: nothing stops a negative price, a duplicate SKU, or an orphaned row
CREATE TABLE products (
    id int,
    sku varchar(255),
    price float,
    category_id int,
    created timestamp
);
```

```sql
-- After
CREATE TABLE products (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sku         text NOT NULL UNIQUE CHECK (sku <> ''),
    price       numeric(12, 2) NOT NULL CHECK (price >= 0),
    category_id bigint NOT NULL REFERENCES categories (id) ON DELETE RESTRICT,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX products_category_id_idx ON products (category_id);
```

## Add an index without blocking writes (PostgreSQL)

```sql
-- Before: blocks inserts, updates and deletes on orders for the whole build
CREATE INDEX orders_customer_id_idx ON orders (customer_id);
```

```sql
-- After: must run outside a transaction block; if it fails, drop the INVALID index and retry
CREATE INDEX CONCURRENTLY IF NOT EXISTS orders_customer_id_idx ON orders (customer_id);
```

Tell the migration tool not to wrap this file in a transaction (for example
`disable_ddl_transaction!` in Rails, `autocommit_block` in Alembic, `-- +goose NO TRANSACTION`).

## Add a `NOT NULL` column in steps

```sql
-- Before: fails on a non-empty table (or, with a volatile default, rewrites it under lock)
ALTER TABLE users ADD COLUMN locale text NOT NULL;
```

```sql
-- After, as separate migrations
-- 1. Add the column, nullable. Deploy code that writes it.
ALTER TABLE users ADD COLUMN locale text;

-- 2. Backfill in batches, each its own transaction; repeat until no rows are updated.
UPDATE users
SET locale = 'en'
WHERE id IN (
    SELECT id FROM users WHERE locale IS NULL ORDER BY id LIMIT 10000
);

-- 3. Enforce it without a long lock (PostgreSQL 12+ uses the validated CHECK to skip the scan).
ALTER TABLE users ADD CONSTRAINT users_locale_not_null CHECK (locale IS NOT NULL) NOT VALID;
ALTER TABLE users VALIDATE CONSTRAINT users_locale_not_null;
ALTER TABLE users ALTER COLUMN locale SET NOT NULL;
ALTER TABLE users DROP CONSTRAINT users_locale_not_null;
```

## Add a foreign key without a long lock (PostgreSQL)

```sql
-- Before: checks every existing row while holding locks on both tables
ALTER TABLE orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers (id);
```

```sql
-- After: two statements, ideally two transactions
SET lock_timeout = '5s';

ALTER TABLE orders
    ADD CONSTRAINT orders_customer_id_fkey
    FOREIGN KEY (customer_id) REFERENCES customers (id) NOT VALID;

ALTER TABLE orders VALIDATE CONSTRAINT orders_customer_id_fkey;
```

## Rename a column with expand and contract

```sql
-- Before: the running application still reads and writes "fullname"
ALTER TABLE users RENAME COLUMN fullname TO display_name;
```

```sql
-- After, across releases
-- Release 1: add the new column; the application writes both and reads the old one.
ALTER TABLE users ADD COLUMN display_name text;

-- Release 2: backfill (in batches on a large table); the application reads the new column.
UPDATE users SET display_name = fullname WHERE display_name IS NULL;

-- Release 3: once nothing reads or writes the old column, drop it.
ALTER TABLE users DROP COLUMN fullname;
```

## Batched delete

```sql
-- Before: one long transaction, locks and bloat
DELETE FROM events WHERE created_at < now() - interval '90 days';
```

```sql
-- After: run repeatedly, committing each time, until it deletes zero rows
DELETE FROM events
WHERE id IN (
    SELECT id
    FROM events
    WHERE created_at < now() - interval '90 days'
    ORDER BY id
    LIMIT 5000
);
```

For data that is always removed by age, partition the table by time and drop partitions.

## Claim a job without two workers taking it

```sql
-- Before: two workers select the same row
SELECT id FROM jobs WHERE status = 'queued' ORDER BY id LIMIT 1;
UPDATE jobs SET status = 'running' WHERE id = $1;
```

```sql
-- After (PostgreSQL 9.5+, MySQL 8+, Oracle; SQL Server uses WITH (UPDLOCK, READPAST))
UPDATE jobs
SET status = 'running', started_at = now()
WHERE id = (
    SELECT id
    FROM jobs
    WHERE status = 'queued'
    ORDER BY id
    LIMIT 1
    FOR UPDATE SKIP LOCKED
)
RETURNING id;
```

## A `SECURITY DEFINER` function with a fixed search path (PostgreSQL)

```sql
-- Before: a caller can put their own "accounts" table first on the search path
CREATE FUNCTION account_balance(p_id bigint) RETURNS numeric
LANGUAGE sql SECURITY DEFINER
AS $$ SELECT balance FROM accounts WHERE id = p_id $$;
```

```sql
-- After
CREATE FUNCTION account_balance(p_id bigint) RETURNS numeric
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = app, pg_temp
AS $$ SELECT balance FROM app.accounts WHERE id = p_id $$;

REVOKE ALL ON FUNCTION account_balance(bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION account_balance(bigint) TO app_reader;
```
