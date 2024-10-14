import type { Request, Response } from "express";
import { User } from "../models";
import {Propagandist, Host, Site} from '../models';
import { Err, cleanObject} from "../utils";
import { HostObj } from "../models/Host";

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

export {getData};