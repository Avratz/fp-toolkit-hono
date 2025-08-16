# @avratz/fp-toolkit-hono

A functional-programming oriented wrapper for **Hono**, offering opinionated helpers and a clean archetype for building type-safe APIs. It promotes composability, explicit error handling with `fp-ts`, and a clean separation between routing, controllers, and services.

---

## Features

- **Functional core, imperative shell** scaffolding
- Minimal **Hono** wrapper with a tiny surface area
- First-class **fp-ts** integration (`TaskEither`-driven handlers)
- **Typed JSON validation** middleware (Zod-compatible)
- Ergonomic helpers: `createApp`, `createRoute`, `validateJson`, `runTaskEither`, `AppError`
- Encourages clear DI boundaries (controllers receive deps, services depend on ports)

> Works great for teams that want predictable flows, strong typing, and consistent architecture across services.

---

## Installation

```bash
npm install @avratz/fp-toolkit-hono hono fp-ts zod
# or
pnpm add @avratz/fp-toolkit-hono hono fp-ts zod
```

**Peer assumptions**

- Node.js 18+
- TypeScript project
- `fp-ts` for effects and `zod` (or compatible) for validation

---

## Quick start

### 1) App bootstrap

Create your entrypoint and register controllers via routes:

```ts
// app.ts
import { createApp } from '@avratz/fp-toolkit-hono'
import { routes } from './routes'

const app = createApp()
routes.forEach(({ route, controller }) => app.route(route, controller))
export default app
```

A typical `routes` module exports something like:

```ts
// routes.ts
import { userController } from './user.controller'
import { makeUserRepo } from './adapters/user-repo'

export const routes = [
	{
		route: '/users',
		controller: userController({ userRepo: makeUserRepo() }),
	},
] as const
```

### 2) Controller (routing + orchestration)

Controllers define endpoints and compose services. They remain thin and side-effect free except for wiring.

```ts
// user.controller.ts
import { createRoute, validateJson, runTaskEither } from '@avratz/fp-toolkit-hono'
import { createUserService } from './user.service'
import { CreateUserBody } from './domain/user.type'
import type { TCreateUserBody } from './domain/user.type'
import type { UserRepository } from './port/user-repository.port'

// Add parsed body to typed env
type CreateUserEnv = { Variables: { body: TCreateUserBody } }

export function userController(deps: { userRepo: UserRepository }) {
	const route = createRoute<CreateUserEnv>()
	const service = createUserService(deps.userRepo)

	route.post('/', validateJson(CreateUserBody), (context) => {
		return runTaskEither(service.registerUser(context.var.body.name))(context)
	})

	route.get('/:id', (context) => {
		return runTaskEither(service.getUser(context.req.param('id')))(context)
	})

	return route
}
```

### 3) Service (business logic)

Services expose pure, composable functions that return `TaskEither<AppError, A>`.

```ts
// user.service.ts
import { AppError } from '@avratz/fp-toolkit-hono'
import { TaskEither } from 'fp-ts/lib/TaskEither'
import type { UserRepository } from './port/user-repository.port'
import type { TUser } from './domain/user.type'

interface UserService {
	getUser: (id: string) => TaskEither<AppError, TUser>
	registerUser: (name: string) => TaskEither<AppError, TUser>
}

export const createUserService = (repo: UserRepository): UserService => ({
	getUser: (id: string) => repo.findById(id),
	registerUser: (name: string) => repo.create(name),
})
```

---

## Concepts & Flow

**Request lifecycle**

1. `validateJson(schema)` parses and validates the request body (e.g., with Zod), storing the typed value in `context.var.body`.
2. Controller calls a service method → returns `TaskEither<AppError, A>`.
3. `runTaskEither(te)(context)` executes the effect and serializes a success or error HTTP response in a uniform format.

**Why **``**?**

- Encodes success/failure in the type system
- Composable chains without `try/catch`
- Predictable, testable logic

---

## API Reference (high-level)

> The public API is intentionally small. Below are the core helpers.

### `createApp()`

Creates a Hono app pre-configured for the FP toolkit conventions.

**Returns**: `Hono` instance

---

### `createRoute<Env = {}>()`

Creates a typed route/controller instance.

**Type params**

- `Env`: extends Hono `Env` (use this to add `Variables` like `body`)

**Returns**: `{ get, post, put, patch, delete, route, ... }` routing methods

---

### `validateJson(schema)`

Middleware that parses JSON and validates against a schema (Zod-compatible). On success, injects `context.var.body` with the inferred type.

**Schema requirements**: an object with a `parse`/`safeParse` interface (e.g., Zod).

---

### `runTaskEither(te)`

Adapter to execute a `TaskEither<AppError, A>` and send an HTTP response.

**Usage**: `runTaskEither(service.someOp(args))(context)`

**Behavior**

- `Right<A>` → 2xx JSON body
- `Left<AppError>` → mapped to structured error response (status + message)

---

### `AppError`

Discriminated union (or branded error) consumed by `runTaskEither` to standardize failures (e.g., `BadRequest`, `NotFound`, `Conflict`, `Internal`).

> Tip: expose constructor helpers like `badRequest(msg)`, `notFound(msg)`, etc., to make error creation consistent.

---

## Validation example (with Zod)

```ts
import { z } from 'zod'

export const CreateUserBody = z.object({
	name: z.string().min(1),
})
export type TCreateUserBody = z.infer<typeof CreateUserBody>
```

```ts
route.post('/', validateJson(CreateUserBody), (c) =>
	runTaskEither(service.registerUser(c.var.body.name))(c),
)
```

---

## Suggested project layout

```
src/
  app.ts
  routes.ts
  user/

    user.controller.ts
    user.service.ts
    domain/
      user.type.ts
      user.core.ts
    port/
      user-repository.port.ts
    adapters/
      user.repository.ts
```

- **domain/**: types, schemas, core functions (pure)
- **port/**: interfaces for external systems
- **adapters/**: implementations (DB, HTTP clients, etc.)
- **controllers**: wiring + http layer
- **services**: business rules (pure/TE)

---

## Error handling

- Define an `AppError` algebra for your app
- Map domain errors to HTTP statuses in one place (inside `runTaskEither` or a custom encoder)
- Prefer small, composable `TaskEither` chains over large try/catch blocks

---

## Testing

- **Services**: test as pure functions returning `TaskEither` (use in-memory ports)
- **Controllers**: test route handlers by invoking them with a mock `context`
- **Validation**: test Zod schemas independently

---

## Versioning

Follows **SemVer**. Breaking changes will bump the **major** version.

---

## Contributing

PRs welcome! Please discuss large changes via issues first.

---

## License

MIT © Avratz
