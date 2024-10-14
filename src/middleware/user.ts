import { Request, Response } from "express";
import { User } from "../models";
import { cleanObject, Err } from "../utils";
import { levelFromPriv, UserObj } from "../models/User";

export const byDisplayName = (req: Request, res: Response) => {
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

export const setPriv = async (req: Request, res: Response) => {
	const token = req.header('x-auth');
	const {target, privlevel} = req.body;
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

export const get = (req: Request, res: Response) => {
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

export const update = (req: Request, res: Response) => {
	const token = req.header("x-auth")
	const {targetUser: {email, displayName}, values}: {targetUser: {email: string, displayName: string}, values: UserObj} = req.body
	if (!token){
		res.status(400).send("no auth token provided!")
	}
	User.findByToken(token).then(user => {
		if (!user){
			res.status(401).send("No user found matching this token")
			return;
		}
		User.findOne({$or: [{email}, {displayName}]}).then(target => {
			if (!target){
				res.status(404).send("No user matching this email or displayName found.")
				return;
			}
			if (user._id === target._id) {
				const {displayName, password} = values
				target.updateOne(cleanObject({
					displayName,
					password
				})).then(t => res.send(t.toJSON()))
			}
		})
	})
}