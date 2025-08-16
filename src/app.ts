import { Env, Hono, Schema } from 'hono'
import { timing } from 'hono/timing'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { requestId } from 'hono/request-id'
import { BlankEnv, BlankSchema } from 'hono/types'

export function createApp<
	T extends Env = BlankEnv,
	Q extends Schema = BlankSchema,
	P extends string = '/',
>() {
	const app = new Hono<T, Q, P>()
	app.use('*', requestId(), timing(), logger(), prettyJSON())
	return app
}

export function createRoute<
	T extends Env = BlankEnv,
	Q extends Schema = BlankSchema,
	P extends string = '/',
>() {
	return new Hono<T, Q, P>()
}
