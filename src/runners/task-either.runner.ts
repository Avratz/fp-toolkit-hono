import type { Context } from 'hono'
import { TaskEither, match } from 'fp-ts/lib/TaskEither'
import { pipe } from 'fp-ts/lib/function.js'
import { jsonErr, jsonOk } from '../http/responses'
import type { AppError } from '../http/errors'
import { ContentfulStatusCode } from 'hono/utils/http-status'

export function runTaskEither<A>(
	te: TaskEither<AppError, A>,
	onOk?: (arg: A) => unknown,
	okStatus: ContentfulStatusCode = 200,
) {
	return async function handler(context: Context) {
		return pipe(
			te,
			match(
				(error: AppError) => jsonErr(context, error),
				(arg: A) => jsonOk(context, onOk ? onOk(arg) : (arg as unknown), okStatus),
			),
		)()
	}
}
