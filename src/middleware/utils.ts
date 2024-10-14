import { Request } from "express";
import { User } from "../models";

export const authenticate = (req: Request, level: 'master' | 'admin' | 'mod' | 'user' = 'admin') => {
	const code: string = req.headers["x-auth"] as string;
	return User.findByToken(code)
}