import { Response } from "express"

export const Err = (err: {status: number, message: string}, res: Response) => {
	res.status(err.status || 500).send(err.message || "Unknown error")
}