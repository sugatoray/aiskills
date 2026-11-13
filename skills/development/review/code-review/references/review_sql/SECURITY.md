# SQL security review

The security scope for SQL: queries, views, functions and procedures, schema definitions and
migrations, in `.sql` files and embedded in application code or ORM calls. It is read for the
security pass of a full review, and on its own, with `WISDOM.md`, when the review runs with
`-s`/`--security`. Rate findings with `../SEVERITY.md` and report them with
`../REPORT_TEMPLATE.md`.

## Scope

In scope: injection, privileges and roles, code that runs with its definer's rights,
row-level and tenant isolation, sensitive data at rest and in logs, credentials, queries a
user can make expensive, and what errors reveal.

Establish first:

- **The engine and version.** Quoting functions, dynamic SQL syntax, privilege models and
  row-level security differ between PostgreSQL, MySQL, SQL Server, SQLite, Oracle and the
  warehouses.
- **Which role runs the statement,** and what else that role can do. A harmless-looking
  query is serious when the application connects as the schema owner.
- **Who controls each value** that reaches the statement, including values stored earlier.

## Where untrusted data enters

- Request parameters that become predicates, sort columns, limits, offsets or table names.
- Values written by one user and later used to build SQL for another (second-order
  injection), including values read inside stored procedures and triggers.
- File and bulk-load input (`COPY`, `LOAD DATA`, `BULK INSERT`), CSV imports, and messages
  from queues.
- Identifiers and fragments from configuration, feature flags or tenant settings.
- Search and filter builders that accept an expression or column list from the client.

## Checks

### Injection

- **Injection.** Any statement assembled by concatenating or interpolating values:
  in application code (f-strings, template literals, `+`, `String.format`), in ORM escape
  hatches (`raw`, `extra`, `text`, `$queryRawUnsafe`, `whereRaw`), and inside stored
  procedures that build dynamic SQL (`EXEC(@sql)`, `EXECUTE IMMEDIATE`, `EXECUTE '…' || x`).
  Use bound parameters everywhere; in dynamic SQL use `sp_executesql` with parameters,
  `EXECUTE … USING`, and `format()` with `%I`/`%L` or `quote_ident`/`QUOTENAME` for
  identifiers.
- **Identifiers can't be bound.** A table, column or sort direction that comes from input
  must be checked against an allow-list in code.
- **`LIKE` patterns from input:** `%` and `_` are wildcards even in a bound parameter. Escape
  them (with an `ESCAPE` clause) when a literal match is meant.
- **Second-order injection:** a value bound safely on the way in, then concatenated into
  dynamic SQL in a later job, report, trigger or procedure.
- **`ORDER BY`, `LIMIT` and column lists built from input,** and ORM methods that take raw
  fragments for them.

### Privileges and definer rights

- **Privileges.** `GRANT ALL`, grants to `PUBLIC`, the application connecting as the schema
  owner or a superuser, migrations and the application sharing one role. The application role
  needs data access, not DDL.
- **`SECURITY DEFINER` functions (PostgreSQL)** without a fixed `search_path`: a caller can
  shadow the objects the function refers to. Same idea for `EXECUTE AS OWNER` (SQL Server) and
  definer-rights views and procedures in MySQL and Oracle: check what the elevated code lets a
  caller reach.
- **Default privileges and ownership in migrations:** new tables and functions created by a
  superuser or migration role and left readable or executable by roles that should not have
  them. In PostgreSQL, functions are executable by `PUBLIC` unless revoked.
- **Extensions and server-side features that reach outside the database:** `COPY … PROGRAM`
  and untrusted procedural languages (PostgreSQL), `xp_cmdshell` and `OPENROWSET` (SQL
  Server), `LOAD DATA LOCAL` and `INTO OUTFILE` (MySQL), external tables and database links.

### Row-level and tenant isolation

- **Row-level access.** Multi-tenant or per-user data protected only by a `WHERE` the
  application remembers to add; views that expose more columns or rows than their users should
  see; row-level security enabled but bypassed by the table owner.
- **A new query, view or join that omits the tenant or owner predicate** its neighbours
  have, and `OR` conditions whose precedence lets the predicate be bypassed
  (`WHERE tenant_id = $1 AND a OR b`).
- **Ids taken from the request and looked up without an ownership check** (the SQL side of
  an insecure direct object reference).

### Sensitive data and credentials

- **Sensitive data:** passwords stored unhashed or with a fast hash; secrets, tokens,
  personal data in plain columns, in logs or audit tables, or in `INSERT` statements checked
  into the repository (seed and fixture files); production data in test fixtures.
- **Credentials** in connection strings, migration files or scripts.
- **Migrations that copy, back up or widen access to sensitive columns:** `CREATE TABLE …
  AS SELECT *`, ad-hoc backup tables, new views or replicas, columns added to an export.
- **Destructive statements with no guard:** `DELETE` or `UPDATE` without a `WHERE`,
  `TRUNCATE`, `DROP` in a script that could run against the wrong database.

### Availability and information disclosure

- **Unbounded queries reachable by users:** no `LIMIT`, user-controlled `LIMIT`/`OFFSET`
  with no cap, `LIKE '%…%'` on large tables, expensive queries without a statement timeout.
- **Error text returned to clients** that includes the SQL or schema details.

## Tools

| Purpose | Command | Notes |
| --- | --- | --- |
| SQL built from strings in application code | `git grep -nE "(execute\|query\|raw\|text)\((f[\"']\|\`\|[\"'][^\"']*[\"'] *[+%])" -- '*.py' '*.js' '*.ts'` | A rough net. Extend it for the project's languages and ORM escape hatches (`whereRaw`, `$queryRawUnsafe`, `extra`, `createNativeQuery`). |
| Dynamic SQL inside the database | `git grep -niE 'EXEC(UTE)? *\(\|EXECUTE IMMEDIATE\|sp_executesql\|EXECUTE +[^;]*\|\|\|PREPARE .* FROM' -- '*.sql'` | Read each: is every interpolated part bound or quoted as an identifier? |
| Grants and definer rights | `git grep -niE 'GRANT \|REVOKE \|SECURITY DEFINER\|EXECUTE AS\|SQL SECURITY\|ROW LEVEL SECURITY\|CREATE POLICY\|SUPERUSER\|xp_cmdshell' -- '*.sql'` | |
| What a role can do (PostgreSQL) | `psql -c '\du'`, `psql -c '\dp table'`, `psql -c '\ddp'`, `SELECT proname, prosecdef, proconfig FROM pg_proc WHERE prosecdef;` | On a disposable database with the migrations applied. `proconfig` shows whether `search_path` is set. |
| Row-level security (PostgreSQL) | `SELECT relname, relrowsecurity, relforcerowsecurity FROM pg_class WHERE relkind = 'r';`, `SELECT * FROM pg_policies;` | Then test as the application role, not the owner. |
| Secrets | `gitleaks detect --no-git --source .` | Seed, fixture and dump files are where real data and credentials turn up. |
| Lint | `sqlfluff lint --dialect <dialect> path/` | Finds no security defects; useful only to confirm the file parses. |

Never test against a production database, or with credentials found in the repository.

## What this review does not establish

It reads statements and schema. It does not see the live database: actual grants, role
memberships, network exposure, encryption at rest, auditing or backups. Confirm privilege
and row-level findings against a database built from the migrations, and recommend a
configuration review of the real one where the change warrants it.
