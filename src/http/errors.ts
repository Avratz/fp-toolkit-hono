import { ClientErrorStatusCode, ServerErrorStatusCode } from 'hono/utils/http-status'
import { deepFreeze } from '../utils/deep-freeze.util'

export const APP_ERRORS = deepFreeze({
	InvalidInput: { _tag: 'InvalidInput', message: 'Invalid body' },
} as const)

type AppErrorTag = keyof typeof APP_ERRORS
type KnownAppError = (typeof APP_ERRORS)[AppErrorTag]

export type AppError = KnownAppError | { _tag: string; message: string }
type AppErrorCodes = ClientErrorStatusCode | ServerErrorStatusCode

const APP_ERROR_CODES = deepFreeze({
	InvalidInput: 400,
} as const satisfies Record<AppErrorTag, AppErrorCodes>)

function isKnownTag(tag: string): tag is AppErrorTag {
	return Object.prototype.hasOwnProperty.call(APP_ERROR_CODES, tag)
}

export const toHttpStatus = (e: AppError): AppErrorCodes =>
	isKnownTag(e._tag) ? APP_ERROR_CODES[e._tag] : 500
