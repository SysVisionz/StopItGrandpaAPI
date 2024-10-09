const {Propagandist, Host, Site} = require('../models');
const {passcode} = require('../db/dataConfig');

const addHost = (req, res) => {
	var code = req.header('auth');
	if (code !== passcode){
		return res.status(401).send('Insufficient Privileges');
	}
	const {body} = req
	return hostHandler(body);
}

const addPropagandist = (req, res) => {
	var code = req.header('auth');
	if (code !== passcode){
		return res.status(401).send('Insufficient Privileges');
	}
	const {body} = req
	return propagandistHandler(body);
}

const propagandistHandler = content => {
	const {address} = content;
	return Propagandist.findOne({address}).then( propagandist => {
		if (!propagandist){
			propagandist = new Propagandist({address,});
		}
		const {
			name = propagandist.name, 
			description = propagandist.description, 
			reasoning = propagandist.reasoning, 
			picture = propagandist.picture,
			site = propagandist.site
		} = content;
		return Site.find({host: site}).then(site => {
			if (!site){
				site = new Site({host: site, propagandists: [propagandist.address]})
			}
			else if(!site.propagandists.contains(propagandist.address)) {
				site.propagandists.push(propagandist.address);
			}
			return propagandist.updateOne({
				$set: {
					name,
					description,
					reasoning,
					picture,
					site
				}
			}).then(site.save().then( () => () => propagandist.save().then(() => propagandist.toJSON())));
		})
	})
}

const hostHandler = content => {
	const {address} = content;
	return Host.findOne({address}).then(host => {
		if (!host){
			const {description, name, reasoning, picture, propaganda} = content;
			host = new Host({address, propaganda, description, name, reasoning, picture});
			return host.save().then(() => host.toJSON);
		}
		const {description = host.description, name = host.name, reasoning = host.reasoning, picture = host.picture, propaganda = host.propaganda} = content;
		return host.updateOne({
			$set:{
				name,
				description,
				reasoning,
				picture,
				propaganda
			}
		}).then(() => host.save().then(() => host.toJSON()))
	});
}

const addHosts = (req, res) => {
	var code = req.header('auth');
	if (code !== passcode){
		return res.status(401).send('Insufficient Privileges');
	}
	const {body} = req;;
	const retval = [];
	for (const i in body){
		retval.push(hostHandler(body[i]))
	}
	res.send(retval);
}
const addPropagandists = (req, res) => {
	var code = req.header('auth');
	if (code !== passcode){
		return res.status(401).send('Insufficient Privileges');
	}
	const {body} = req;;
	const retval = [];
	for (const i in body){
		retval.push(propagandistHandler(body[i]))
	}
	res.send(retval);
}

const getData = (req, res) => {
	const data = {
	    hosts: [],
	    propagandists: [],
	    sites: [],
	    redirects: []
	}
	return Site.find().lean().then(sites => {
		return Host.find().lean().then( hosts => {
			for (const i in sites){
				data.propagandists.push({
					[sites[i].host]: data.sites[i].propagandists
				})
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

module.exports.store = {addHosts, addPropagandists, addHost, addPropagandist, getData};