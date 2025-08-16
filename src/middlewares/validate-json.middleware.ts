import type { Context, MiddlewareHandler } from 'hono'
import * as TE from 'fp-ts/TaskEither'
import { pipe } from 'fp-ts/function'
import type { z } from 'zod'
import type { AppError } from '../http/errors'
import { APP_ERRORS, toHttpStatus } from '../http/errors'
import { validateTaskEither } from '../validations/zod-task-either.validation'

function readJsonTE<T>(c: Context) {
	return TE.tryCatch<AppError, T>(
		() => c.req.json() as Promise<T>,
		() => APP_ERRORS.InvalidInput,
	)
}

export function validateJson<S extends z.ZodTypeAny>(schema: S): MiddlewareHandler {
	return async (context, next) => {
		const result = await pipe(
			readJsonTE<z.infer<S>>(context),
			TE.chain(validateTaskEither<z.infer<S>>(schema)),
		)()

		if (result._tag === 'Left') {
			return context.json(result.left, toHttpStatus(result.left))
		}

		context.set('body', result.right)
		await next()
	}
}
