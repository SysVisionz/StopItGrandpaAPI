import http from 'http';
import express from 'express';
import path from 'path'
import {store, auth} from './src/middleware';
import { config } from 'dotenv';

config()

var app = express();
var server = http.createServer(app);
app.use(express.json())

app.get('/', function(req, res){
	res.sendFile("index.html", {
		root: path.join(__dirname)
	});

})

app.get('/data', store.getData)

app.post('/login', auth.login)

app.get('/user?*', auth.getUser)

app.get('/register', auth.register)

app.get('/reset')

app.delete('/propaganda/remove', store.removePropagandist);

app.delete('/host/remove', store.removeHost)

app.post('/propaganda/multi', store.addPropagandists)

app.post('/propaganda/add', store.addPropagandist)

app.post('/host/add', store.addHost(true))

app.post('/redirect/add', store.addHost())

app.post('/host/multi', store.addHosts(true));

app.post('/redirect/multi', store.addHosts())

server.listen(8088, () => console.log('server up on port 8088'));