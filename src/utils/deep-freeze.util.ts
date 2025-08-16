type DeepReadonly<T> = T extends Function
	? T
	: T extends object
	? { readonly [K in keyof T]: DeepReadonly<T[K]> }
	: T

export function deepFreeze<const T extends object>(obj: T): DeepReadonly<T> {
	if (Object.isFrozen(obj)) {
		return obj as DeepReadonly<T>
	}
	Reflect.ownKeys(obj).forEach((k) => {
		const v = (obj as any)[k]
		if (v && (typeof v === 'object' || typeof v === 'function')) deepFreeze(v)
	})
	return Object.freeze(obj) as DeepReadonly<T>
}
