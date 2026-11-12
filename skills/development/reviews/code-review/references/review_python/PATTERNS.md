# Python fix patterns

Before/after pairs for the findings that come up most. Use them to shape a suggested change;
adapt names and style to the file under review, and check the project's minimum Python version
(noted where a fix needs a recent one).

## Mutable default argument

```python
# Before: one list shared by every call
def add_tag(tag, tags=[]):
    tags.append(tag)
    return tags
```

```python
# After
def add_tag(tag, tags=None):
    if tags is None:
        tags = []
    tags.append(tag)
    return tags
```

In a dataclass: `tags: list[str] = field(default_factory=list)`.

## `None` versus falsy

```python
# Before: a timeout of 0 and an empty name are replaced too
timeout = options.get("timeout") or 30
```

```python
# After
timeout = options.get("timeout")
if timeout is None:
    timeout = 30
```

## Narrow the `try`, keep the cause

```python
# Before: hides bugs in parse(), loses the original error
try:
    data = json.loads(path.read_text())
    config = parse(data)
except Exception:
    raise ConfigError("bad config")
```

```python
# After
try:
    data = json.loads(path.read_text(encoding="utf-8"))
except (OSError, json.JSONDecodeError) as err:
    raise ConfigError(f"cannot read config {path}: {err}") from err
config = parse(data)
```

## Resource cleanup

```python
# Before: the file stays open if process() raises
f = open(path)
process(f.read())
f.close()
```

```python
# After
with open(path, encoding="utf-8") as f:
    process(f.read())
```

## Timeouts and status on HTTP calls

```python
# Before: waits forever; a 500 is parsed as if it were data
resp = requests.get(url)
items = resp.json()["items"]
```

```python
# After
resp = requests.get(url, timeout=(3.05, 10))  # (connect, read) seconds
resp.raise_for_status()
items = resp.json()["items"]
```

## Subprocess without a shell

```python
# Before: `name` can inject commands; failure is ignored
subprocess.run(f"tar -czf {name}.tgz {src}", shell=True)
```

```python
# After
subprocess.run(["tar", "-czf", f"{name}.tgz", "--", src], check=True, timeout=300)
```

## Parameterised SQL

```python
# Before: SQL injection
cur.execute(f"SELECT id FROM users WHERE email = '{email}'")
```

```python
# After (placeholder style depends on the driver: %s, ?, :name)
cur.execute("SELECT id FROM users WHERE email = %s", (email,))
```

A column or table name can't be a parameter. Pick it from a fixed set:

```python
SORTABLE = {"created_at", "email"}
if sort not in SORTABLE:
    raise ValueError(f"cannot sort by {sort!r}")
cur.execute(f"SELECT id FROM users ORDER BY {sort} LIMIT %s", (limit,))
```

## Path containment

```python
# Before: "../../etc/passwd" or an absolute path escapes
target = os.path.join(UPLOAD_DIR, filename)
```

```python
# After (is_relative_to: Python 3.9+)
base = Path(UPLOAD_DIR).resolve()
target = (base / filename).resolve()
if not target.is_relative_to(base):
    raise ValueError("path escapes the upload directory")
```

## Tokens and secret comparison

```python
# Before: predictable token, timing-dependent comparison
token = "".join(random.choices(string.ascii_letters, k=32))
if supplied == expected:
    grant()
```

```python
# After
token = secrets.token_urlsafe(32)
if hmac.compare_digest(supplied, expected):
    grant()
```

## Aware datetimes

```python
# Before: naive; utcnow() is deprecated from 3.12
expires = datetime.utcnow() + timedelta(hours=1)
```

```python
# After
expires = datetime.now(timezone.utc) + timedelta(hours=1)
```

## Money

```python
# Before: 0.1 + 0.2 != 0.3
total = sum(float(line["price"]) * line["qty"] for line in lines)
```

```python
# After
total = sum(Decimal(str(line["price"])) * line["qty"] for line in lines)
total = total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
```

## Closure in a loop

```python
# Before: every handler sees the last name
handlers = [lambda event: dispatch(name, event) for name in names]
```

```python
# After
handlers = [functools.partial(dispatch, name) for name in names]
```

## Blocking call in a coroutine

```python
# Before: stalls every other task on the loop
async def fetch_report(report_id):
    time.sleep(1)
    return requests.get(f"{API}/reports/{report_id}", timeout=10).json()
```

```python
# After (asyncio.to_thread: Python 3.9+), or use an async HTTP client
async def fetch_report(report_id):
    await asyncio.sleep(1)
    resp = await asyncio.to_thread(requests.get, f"{API}/reports/{report_id}", timeout=10)
    resp.raise_for_status()
    return resp.json()
```

## Fire-and-forget tasks

```python
# Before: the task may be garbage-collected; its exception is never seen
asyncio.create_task(send_email(user))
```

```python
# After: keep a reference until it finishes
task = asyncio.create_task(send_email(user))
background_tasks.add(task)
task.add_done_callback(background_tasks.discard)
```

When the caller should wait for the work, use a task group (Python 3.11+):

```python
async with asyncio.TaskGroup() as tg:
    for user in users:
        tg.create_task(send_email(user))
```

## Bounded concurrency

```python
# Before: thousands of requests at once
results = await asyncio.gather(*(fetch(u) for u in urls))
```

```python
# After
limit = asyncio.Semaphore(10)

async def fetch_limited(url):
    async with limit:
        return await fetch(url)

results = await asyncio.gather(*(fetch_limited(u) for u in urls))
```

## Shared state across threads

```python
# Before: two threads can both read the same count
def record(self, key):
    self.counts[key] = self.counts.get(key, 0) + 1
```

```python
# After
def record(self, key):
    with self._lock:  # threading.Lock() created in __init__
        self.counts[key] = self.counts.get(key, 0) + 1
```

## Membership test in a loop

```python
# Before: O(len(orders) * len(blocked))
flagged = [o for o in orders if o.customer_id in blocked_ids_list]
```

```python
# After
blocked = set(blocked_ids_list)
flagged = [o for o in orders if o.customer_id in blocked]
```

## Record instead of a dict

```python
# Before: keys unchecked, typos pass silently
def make_user(row):
    return {"id": row[0], "email": row[1], "admin": bool(row[2])}
```

```python
# After
@dataclass(frozen=True, slots=True)  # slots: Python 3.10+
class User:
    id: int
    email: str
    admin: bool = False

def make_user(row) -> User:
    return User(id=row[0], email=row[1], admin=bool(row[2]))
```

## A test that can fail

```python
# Before: passes whatever parse_port does with bad input
def test_parse_port():
    try:
        parse_port("abc")
    except Exception:
        pass
```

```python
# After
@pytest.mark.parametrize("raw", ["abc", "", "-1", "65536"])
def test_parse_port_rejects_invalid(raw):
    with pytest.raises(ValueError, match="port"):
        parse_port(raw)

def test_parse_port_accepts_valid():
    assert parse_port("8080") == 8080
```
