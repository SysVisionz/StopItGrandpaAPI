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

const byDisplayName = (req: Request, res: Response) => {
	const token = req.header('x-auth');
	const displayName = req.header('target');
	if (!displayName || !token){
		res.status(400).send({message: "displayName and token both required."})
		return
	}
	return User.findByDisplayName(displayName, token)
	.then(userId => res.status(200).header('target', userId._id.toString()).send())
	.catch(err => Err(err, res));
}

const setUserPriv = async (req: Request, res: Response) => {
	const token = req.header('x-auth');
	const {target, privlevel} = await req.body.json();
	let required = levelFromPriv(privlevel)
	if (!required){
		return res.status(400).send("Improper privilege level provided")
	}
	const needed = privlevel === 3 ? 'master' : ['master', 'admin', 'mod', 'user'][privlevel] as 'master'|'admin'|'mod'|'user'
	if (!needed){
		return res.status(400).send("Improper privilege level provided")
	}
	//find current user by their token
	return User.findByToken(token).then(user => {
		if (!user){
			return Promise.reject({status: 404, message: "no user found"});
		}
		//only master admin can promote users to master, otherwise you can only promote to one level lower.
		if (!user.hasAtLeast[needed]){
			return Promise.reject({status: 401, message: "You may only promote people to one privilege level lower than yours."});
		}
		//find target user by their email
		return User.findOne({email: target})
		.then(targetUser => {
			if (!targetUser) {
				return Promise.reject({status: 404});
			}
			switch(targetUser.privs) { 
				//admin can be promoted to master admin
				case 'admin':
					return User.findOneAndUpdate({_id: targetUser._id}, {$set: {type: 'master'}}, {new: true}).then(user => res.status(200).send(user!.displayName));
				default:
					return Promise.reject({status: 400, message: 'invalid user type!'})
			}
		})
		.catch(err => res.status(err.status).send(err.message));
	})
	.catch(err => res.status(err.status).send(err.message));
}

const getUser = (req: Request, res: Response) => {
	const {displayName, email } = req.query
	if (!(displayName || email)){
		res.status(400).send("display name or email required.")
		return;
	}
	User.findOne(displayName && email ? {displayName, email} : displayName ? {displayName} : {email}).then((user) => {
		if (!user){
			res.status(404).send('User not found')
		}
		else {
			res.send(user?.toJSON())
		}
	})
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

export {login, setUserPriv, byDisplayName, getUser, register};