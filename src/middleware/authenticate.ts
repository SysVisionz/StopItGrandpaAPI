import { Response } from 'express';
import {User} from '../models';

const authByToken = (req: Request, res: Response) => {
	var token = req.headers.get('x-auth');
	if (!token) {
		res.status(400).send('no token provided');
	}
	return User.findByToken(token).then(user => {
		if (!user) {
			return Promise.reject({status: 401, message: 'no user found'});
		}
		req.user = user;
		req.token = token;
		res.send(user);
	})
	.catch(err => {
		return res.status(err.status).send(err.message)
	});
}

const login = async (req, res) => {
	const {email, password, persist} = await req.json();
	return User.findByCredentials(email, password).then( user => {
		user.persist = persist;
		return user.generateAuthToken().then(token => {
			return res.header('x-auth', token).send(user);
		})
	}).catch(err => res.status(err.status).send());
}

const byDisplayName = (req, res) => {
	const token = req.header('x-auth');
	const displayName = req.header('target');
	return User.findByDisplayName(displayName, token)
	.then(userId => res.status(200).header('target', userId).send())
	.catch(err => res.status(err.status).send());
}

const setUserPriv = (req, res) => new Promise(async (res, rej) => {
	const token = req.header('x-auth');
	const {target, privlevel} = await req.json();
	//find current user by their token
	return User.findByToken(token).then(user => {
		if (!user){
			return Promise.reject({status: 401, message: "no user found"});
		}
		//only master admin can promote users to master, otherwise you can only promote to one level lower.
		if (!user.hasAtLeast('master') && !user.hasAtLeast(User.priv(privlevel)+1)){
			return Promise.reject({status: 401, message: "You may only promote people to one privilege level lower than yours."});
		}
		//find target user by their email
		return User.findOne({email: target})
		.then(targetUser => {
			if (!targetUser) {
				return Promise.reject({status: 404});
			}
			switch(targetUser.type) { 
				//admin can be promoted to master admin
				case 'admin':
					return User.findOneAndUpdate({_id: targetUser._id}, {$set: {type: 'master'}}, {new: true}).then(user => res.status(200).send(user.displayName));
				default:
					return Promise.reject({status: 400, message: 'invalid user type!'})
			}
		})
		.catch(err => res.status(err.status).send(err.message));
	})
	.catch(err => res.status(err.status).send(err.message));
})

export {authByToken, login, setUserPriv};