import { Request, Response } from "express";
import { authenticate } from './utils'
import { Err } from "../utils";
import { Host } from "../models";
import { HostObj } from "../models/Host";

export const add = (isBad?: boolean) => (req: Request, res: Response) => {
	authenticate(req).then(() => {
		const {body} = req
		return handler(body, isBad).then(obj => {
			res.send(obj)
		});
	}).catch(err => Err(err, res))
}

export const massAdd = (isBad?: boolean) => (req: Request, res: Response) => {
	authenticate(req).then(() => {
		const {body} = req;
		handlerChain(body, isBad).then((retval) => res.send(retval))
	}).catch(err => {
		Err(err, res)
	})
}

export const remove = (req: Request, res: Response) => {
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

const handler = (content: {address: string, description?: string, name?: string, reasoning?: string, picture?: Buffer}, propaganda?: boolean) => new Promise<HostObj>((res, rej) => {
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

const handlerChain = (hosts: HostObj[], propagandists?: boolean) => {
	return new Promise<HostObj[]>((res, rej) => {
		const curr = hosts.pop()
		if (!curr){
			res([])
			return;
		}
		handler(curr, propagandists).then((host) => {
			hosts.length ? handlerChain(hosts).then(hostvals => res([...hostvals, host])) : res([host])
		})
	})
}
