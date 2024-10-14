import {User} from '../models';
import { Request, Response } from 'express';
import { Err } from '../utils';
import { levelFromPriv } from '../models/User';

const login = async (req: Request, res: Response) => {
	const {email, displayName, password, persist} = req.body;
	if (!((email|| displayName) || password)){
		res.status(400).send("Email or Display Name and Password required.")
	}
	User.findByCredentials({email, displayName}, password).then( user => {
		user.persist = persist;
		return user.generateAuthToken().then(token => {
			return res.header('x-auth', token).send(user);
		})
	}).catch(err => Err(err, res));
}

const resetPassword = (req: Request, res: Response) => {
	// todo: we're going to use this to create an email.
	const {EMAIL: email} = process.env
}

const register = (req: Request, res: Response) => {
	const {email, displayName, password, persist} = req.body
	User.findOne({$or: [{email}, {displayName}]}).then(existing => {
		if (existing){
			res.status(401).send(`user with this ${email === existing.email ? "email" : "display name"} already exists.`)
			return;
		}
		const user = new User({email, displayName, password, persist, privs: "user"})
		user.save().then(() => {
			res.send("User registration successful!")
		})
	})
}

export {login, register};