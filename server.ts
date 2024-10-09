import http from 'http';
import express from 'express';
import path from 'path'
import {MongoClient} from 'mongodb';
import {store} from './src/middleware';

var app = express();
var server = http.createServer(app);
var mongoclient = new MongoClient("localhost");
app.use(express.json())

app.get('/', function(req, res){
	res.sendFile("index.html", {
		root: path.join(__dirname)
	});

})

app.get('/data', store.getData)

app.delete('/propaganda/remove', store.removePropagandist);

app.delete('/host/remove', store.removeHost)

app.post('/propaganda/multi', store.addPropagandists)

app.post('/propaganda/add', store.addPropagandist)

app.post('/host/add', store.addHost)

app.post('/host/multi', store.addHosts);

server.listen(8088, () => console.log('server up on port 8088'));