import { fromEither, TaskEither } from 'fp-ts/lib/TaskEither.js'
import { z } from 'zod'
import { APP_ERRORS, type AppError } from '../http/errors'

export function validateTaskEither<A>(schema: z.ZodSchema<A>) {
	return (payload: unknown): TaskEither<AppError, A> =>
		fromEither(
			schema.safeParse(payload).success
				? { _tag: 'Right', right: schema.parse(payload) as A }
				: { _tag: 'Left', left: APP_ERRORS.InvalidInput },
		)
}
