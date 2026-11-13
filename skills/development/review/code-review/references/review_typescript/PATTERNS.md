# TypeScript fix patterns

Before/after pairs for the findings that come up most. Use them to shape a suggested change;
adapt names and style to the file under review, and check the project's TypeScript version and
`tsconfig.json` (noted where a fix needs a recent version). The JavaScript patterns in
`../review_javascript/PATTERNS.md` apply to TypeScript too.

## Validate at the boundary instead of asserting

```ts
// Before: nothing checks that the body has this shape
const order = (await req.json()) as CreateOrder;
```

With a schema library the project already uses (zod shown), the type is derived from the check:

```ts
// After
const CreateOrder = z.object({
  sku: z.string().min(1),
  quantity: z.number().int().positive(),
});
type CreateOrder = z.infer<typeof CreateOrder>;

const parsed = CreateOrder.safeParse(await req.json());
if (!parsed.success) {
  return Response.json({ error: parsed.error.flatten() }, { status: 400 });
}
const order = parsed.data;
```

Without one, a guard that tests every field:

```ts
// After
interface CreateOrder {
  sku: string;
  quantity: number;
}

function isCreateOrder(value: unknown): value is CreateOrder {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.sku === "string" &&
    v.sku.length > 0 &&
    typeof v.quantity === "number" &&
    Number.isInteger(v.quantity) &&
    v.quantity > 0
  );
}
```

## `unknown` in `catch`

```ts
// Before: `err` is any (or unknown); `.message` may not exist
try {
  await save(order);
} catch (err) {
  logger.error(err.message);
}
```

```ts
// After
try {
  await save(order);
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  logger.error(message);
}
```

## Handle the missing case instead of `!`

```ts
// Before: throws "Cannot read properties of undefined" far from the cause
const owner = users.find((u) => u.id === ownerId)!;
notify(owner.email);
```

```ts
// After
const owner = users.find((u) => u.id === ownerId);
if (owner === undefined) {
  throw new Error(`owner ${ownerId} not found`);
}
notify(owner.email);
```

## Discriminated union instead of optional fields

```ts
// Before: allows { status: "ok" } with no data, or data and error together
interface FetchState<T> {
  status: "idle" | "loading" | "ok" | "error";
  data?: T;
  error?: string;
}
```

```ts
// After
type FetchState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; data: T }
  | { status: "error"; error: string };
```

## Exhaustive `switch`

```ts
// Before: a new Shape member compiles and returns undefined
function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rect":
      return shape.width * shape.height;
  }
}
```

```ts
// After: adding a member is a compile error here until it is handled
function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rect":
      return shape.width * shape.height;
    default: {
      const unhandled: never = shape;
      throw new Error(`unhandled shape: ${JSON.stringify(unhandled)}`);
    }
  }
}
```

## `@ts-expect-error` with a reason

```ts
// Before: hides this error and any future one on the line
// @ts-ignore
legacy.configure({ retries: "3" });
```

```ts
// After: fails the build once the upstream types are fixed
// @ts-expect-error legacy-sdk 2.x types `retries` as number but only accepts a string (issue #412)
legacy.configure({ retries: "3" });
```

## Indexing that may miss

```ts
// Before: typed as Price, undefined at run time for an unknown code
const price = prices[code].amount;
```

```ts
// After
const entry = prices[code];
if (entry === undefined) {
  throw new Error(`no price for ${code}`);
}
const price = entry.amount;
```

With `noUncheckedIndexedAccess` on, the compiler requires this. A `Map` makes the possible miss
part of the type without that option: `prices.get(code)` is `Price | undefined`.

## Constant tables: `as const` and `satisfies`

```ts
// Before: keys widen to string, so a typo in a lookup compiles
const RETRY_DELAY_MS: Record<string, number> = { low: 1000, high: 100 };
const delay = RETRY_DELAY_MS[priorty];
```

```ts
// After (satisfies: TypeScript 4.9+)
const RETRY_DELAY_MS = { low: 1000, high: 100 } as const satisfies Record<string, number>;
type Priority = keyof typeof RETRY_DELAY_MS;

function delayFor(priority: Priority): number {
  return RETRY_DELAY_MS[priority];
}
```

## Union of literals instead of a numeric enum

```ts
// Before: any number is accepted where a Role is expected in older TypeScript; not erasable
enum Role {
  Viewer,
  Editor,
  Admin,
}
```

```ts
// After
const ROLES = ["viewer", "editor", "admin"] as const;
type Role = (typeof ROLES)[number];

function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}
```

## Branded IDs

```ts
// Before: nothing stops an order id being passed as a user id
function loadUser(id: string): Promise<User> {
  return db.users.get(id);
}
```

```ts
// After
type Brand<T, Name extends string> = T & { readonly __brand: Name };
type UserId = Brand<string, "UserId">;
type OrderId = Brand<string, "OrderId">;

function toUserId(raw: string): UserId {
  if (!/^usr_[a-z0-9]+$/.test(raw)) throw new Error(`not a user id: ${raw}`);
  return raw as UserId;
}

function loadUser(id: UserId): Promise<User> {
  return db.users.get(id);
}
```

The one assertion lives in the function that validates.

## Narrow the update type

```ts
// Before: lets a caller blank the id or the owner
function updateProject(id: string, changes: Partial<Project>): Promise<Project> {
  return db.projects.update(id, changes);
}
```

```ts
// After
type ProjectChanges = Partial<Pick<Project, "name" | "description" | "archived">>;

function updateProject(id: string, changes: ProjectChanges): Promise<Project> {
  return db.projects.update(id, changes);
}
```

## Read-only parameters

```ts
// Before: sorts the caller's array in place
function topScores(scores: number[], n: number): number[] {
  return scores.sort((a, b) => b - a).slice(0, n);
}
```

```ts
// After: the mutation no longer compiles, so the copy is forced
function topScores(scores: readonly number[], n: number): number[] {
  return [...scores].sort((a, b) => b - a).slice(0, n);
}
```

## Async callback where `void` is expected

```ts
// Before: type-checks; the rejection is unhandled and nothing waits
button.addEventListener("click", async () => {
  await submit(form);
});
```

```ts
// After
button.addEventListener("click", () => {
  submit(form).catch((err: unknown) => {
    showError(err instanceof Error ? err.message : String(err));
  });
});
```

## Explicit return type on an exported function

```ts
// Before: the public type is whatever the body happens to infer (here Promise<any>)
export async function getSettings(userId: string) {
  const res = await fetch(`/api/users/${userId}/settings`);
  return res.json();
}
```

```ts
// After
export async function getSettings(userId: string): Promise<Settings> {
  const res = await fetch(`/api/users/${userId}/settings`);
  if (!res.ok) throw new Error(`settings request failed: ${res.status}`);
  return parseSettings(await res.json());
}
```

`parseSettings` validates the `unknown` body (see the first pattern).

## Type-only imports

```ts
// Before: may keep the module, and its side effects, in the output
import { Order, createOrder } from "./orders";
```

```ts
// After
import { createOrder, type Order } from "./orders";
```

## Typed mocks

```ts
// Before: the mock drifts from the real interface unnoticed
const client = { send: vi.fn() } as any;
```

```ts
// After: annotated, so it stops compiling when MailClient changes shape
const send = vi.fn().mockResolvedValue({ id: "msg_1" });
const client: MailClient = { send };
```
