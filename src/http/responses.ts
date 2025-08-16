import type { Context } from 'hono'
import type { AppError } from './errors'
import { toHttpStatus } from './errors'
import { ContentfulStatusCode } from 'hono/utils/http-status'

export function jsonOk<A>(c: Context, body: A, status: ContentfulStatusCode = 200) {
	return c.json(body as any, status)
}

export function jsonErr(c: Context, e: AppError) {
	return c.json({ error: e._tag, message: e.message }, toHttpStatus(e))
}
