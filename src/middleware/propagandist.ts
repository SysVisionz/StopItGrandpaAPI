import {Request, Response } from 'express'
import { authenticate } from './utils'
import { Err } from '../utils'
import { Propagandist, Site, User } from '../models'

export const add = (req: Request, res: Response) => {
	authenticate(req).then(user => {
		user!.hasAtLeast.admin
		const {body} = req
		siteAdd(body.site, body.address);
		handler(body).then((obj) => {
			res.send(obj)
		})
	}).catch(err => Err(err, res))
}

const siteAdd = (host: string | string, propagandistOrPs: string | string[]) => new Promise<string[]>((res, rej) => {
	Site.findOne({host}).then (site => {
		const propagandist = typeof propagandistOrPs === 'string' ? propagandistOrPs : propagandistOrPs.pop()
		if (!propagandist){
			return res(site?.propagandists)
		}
		if (!site) {
			const site = new Site({host, propagandists: typeof propagandist === 'object' ? propagandist : [propagandist]});
			return site.save().then(() => res(site!.propagandists));
		}
		if (!site.propagandists.includes(propagandist)){
			site.propagandists.push(propagandist);
		}
		site.markModified('propagandists')
		return site.save().then(() => typeof propagandistOrPs === 'string' 
			? res(site.propagandists) 
			: propagandistOrPs.length 
				? siteAdd(host, propagandistOrPs).then((ret)=> res(ret))
				: res(site.propagandists)
		)
	}).catch(err => {
		rej(err)
	})
})

const siteAddHosts = ( hosts: {[hosts: string]: string | string[]}) => new Promise<{[site: string]: string[]}>((res, rej) => {
	const remains = Object.keys(hosts)
	const curr = remains.pop()
	if (!curr){
		return rej('No hosts provided. Format likely incorrect.')
	}
	siteAdd(curr, hosts[curr]).then((sitePropagandists) => {
		delete hosts[curr]
		remains.length 
			? siteAddHosts(hosts).then((propagandists: {[site: string]: string[]}) => res({...propagandists, [curr]: sitePropagandists}))
			: res({[curr]: sitePropagandists})
	})
})

const handler = (content: {address: string, name?: string, description?: string, reasoning?: string, picture?: Buffer, site?: string}) => new Promise((res, rej) => {
	const {address} = content;
	return Propagandist.findOne({address}).then( propagandist => {
		if (!propagandist){
			const {name, description, reasoning, picture, site} = content;
			propagandist = new Propagandist({address,name, description, reasoning, picture, site});
			return propagandist.save().then(() => res(propagandist!.toJSON()))
		}
		const {
			name = propagandist.name, 
			description = propagandist.description, 
			reasoning = propagandist.reasoning, 
			picture = propagandist.picture,
			site = propagandist.site
		} = content;
		return propagandist.updateOne({
			$set: {
				name,
				description,
				reasoning,
				picture,
				site
			}
		}).then(() => propagandist.save().then(() => res(propagandist.toJSON())));
	}).catch(err => {
		rej(err)
	})
})

export const massAdd = (req: Request, res: Response) => {
	authenticate(req).then(async () => {
		const body = await req.body
		siteAddHosts(body).then(ret => res.send(ret)).catch(err => Err(err, res))
	}).catch(err => {
		Err(err, res)
	})
}

export const remove = (req: Request, res: Response) => {
	authenticate(req).then(() => {
		const {address, site} = req.body;
		Propagandist.findOneAndDelete({address, site}).then(propagandist => {
			if (!propagandist){
				return res.status(404).send('No such propagandist.')
			}
			return res.send(propagandist);
		})
	}).catch(err => {
		Err(err, res)
	})
}