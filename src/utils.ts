import { Response } from "express"

export const Err = (err: {status: number, message: string}, res: Response) => {
	res.status(err.status || 500).send(err.message || "Unknown error")
}
export const cleanObject = <O extends any[] | {[key: string]: any} = any[] | {[key: string]: any}>(obj: O, includeNulls?: boolean): Partial<O> => {
	let val = Array.isArray(obj) ? [] : {}
	const check = includeNulls ? [undefined] : [undefined, null]
	for (const i in obj){
		if (!check.includes((obj as any)[i]))
		if (Array.isArray(obj)){
			(val as any[]).push((obj as any)[i])
		}
		else {
			(val as {[key: string]: any})[i] = obj[i]
		}
	}
	return val
}