import type { Request, Response } from "express";
import { User } from "../models";
import {Propagandist, Host, Site} from '../models';
import { Err, cleanObject} from "../utils";
import { HostObj } from "../models/Host";

const authenticate = (req: Request, level: 'master' | 'admin' | 'mod' | 'user' = 'admin') => {
	const code: string = req.headers["x-auth"] as string;
	return User.findByToken(code)
}

const addHost = (isBad?: boolean) => (req: Request, res: Response) => {
	authenticate(req).then(() => {
		const {body} = req
		return hostHandler(body, isBad).then(obj => {
			res.send(obj)
		});
	}).catch(err => Err(err, res))
}

const addPropagandist = (req: Request, res: Response) => {
	authenticate(req).then(user => {
		user!.hasAtLeast.admin
		const {body} = req
		siteAdd(body.site, body.address);
		propagandistHandler(body).then((obj) => {
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

const propagandistHandler = (content: {address: string, name?: string, description?: string, reasoning?: string, picture?: Buffer, site?: string}) => new Promise((res, rej) => {
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

const hostHandler = (content: {address: string, description?: string, name?: string, reasoning?: string, picture?: Buffer}, propaganda?: boolean) => new Promise<HostObj>((res, rej) => {
	const {address} = content;
	return Host.findOne({address}).then(host => {
		if (!host){
			const {description, name, reasoning, picture} = content;
			host = new Host({address, propaganda, description, name, reasoning, picture});
			return host.save().then(() => res(host!.toJSON()));
		}
		const {description = host.description, name = host.name, reasoning = host.reasoning, picture = host.picture} = content;
		return host.updateOne({
			$set:{
				name,
				description,
				reasoning,
				picture,
				propaganda: propaganda || host.propaganda
			}
		}).then(() => host.save().then(() => res(host.toJSON())))
	}).catch(error => {
		rej(error)
	});
})

const hostHandlerChain = (hosts: HostObj[], propagandists?: boolean) => {
	return new Promise<HostObj[]>((res, rej) => {
		const curr = hosts.pop()
		if (!curr){
			res([])
			return;
		}
		hostHandler(curr, propagandists).then((host) => {
			hosts.length ? hostHandlerChain(hosts).then(hostvals => res([...hostvals, host])) : res([host])
		})
	})
}

const addHosts = (isBad?: boolean) => (req: Request, res: Response) => {
	authenticate(req).then(() => {
		const {body} = req;
		hostHandlerChain(body, isBad).then((retval) => res.send(retval))
	}).catch(err => {
		Err(err, res)
	})
}

const addPropagandists = (req: Request, res: Response) => {
	authenticate(req).then(async () => {
		const body = await req.body
		siteAddHosts(body).then(ret => res.send(ret)).catch(err => Err(err, res))
	}).catch(err => {
		Err(err, res)
	})
}

const addPropagandistsToHost = (req: Request, res: Response) => {
	authenticate(req).then(() => {
		const host = req.header('host')
		if (!host){
			return res.status(400).send("No host provided.")
		}
		req.body.then((body: string[]) => {
			siteAdd(host, body).then((propagandists) => {
				res.send(propagandists)
			})
		})
	}).catch(err => {
		Err(err, res)
	})
}

const getData = (_req: Request, res: Response) => {
	const data = {
	    hosts: [] as string[],
	    propagandists: {} as {[host: string]: string[]},
	    sites: [] as string[],
	    redirects: [] as string[]
	}
	res.setHeader("Access-Control-Allow-Origin", "*")
	res.setHeader('Access-Control-Allow-Methods', 'GET');
	res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
	
	Site.find().lean().then(sites => {
		return Host.find().lean().then( hosts => {
			for (const i in sites){
				data.propagandists[sites[i].host] = sites[i].propagandists;
			}
			for (const i in hosts){
				if (hosts[i].propaganda){
					data.hosts.push(hosts[i].address);
					data.sites.push('*://*.' + hosts[i].address + '/*');
				}
				else{
					data.redirects.push(hosts[i].address)
				}
			}
			return res.send(JSON.stringify(data));
		})
	})
}

const removePropagandist = (req: Request, res: Response) => {
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

const removeHost = (req: Request, res: Response) => {
	authenticate(req).then(() => {
		const {address} = req.body;
		Host.findOneAndDelete({address}).then(host => {
			if (!host){
				return res.status(404).send('No such host.')
			}
			return res.send(host);
		})
	}).catch(err => {
		Err(err, res)
	})
}

export {addHosts, addPropagandists, addPropagandistsToHost, addHost, addPropagandist, getData, removePropagandist, removeHost};