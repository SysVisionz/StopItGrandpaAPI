import http from 'http';
import express from 'express';
import path from 'path'
import {store, auth, user, host, prop} from './src/middleware';
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

app.get('/user?*', user.get)

app.get('/register', auth.register)

app.get('/update?*', user.update)

app.get('/reset', )

app.delete('/propaganda', prop.remove);

app.delete('/host', host.remove)

// app.delete('/mass-propaganda', prop.massRemove)

// app.delete('/mass-host', host.massRemove)

app.post('/mass-propaganda', prop.massAdd)

app.post('/propaganda', prop.add)

app.post('/host', host.add(true))

app.post('/redirect', host.massAdd())

app.post('/mass-host', host.massAdd(true));

app.post('/mass-redirect', host.massAdd())

server.listen(8088, () => console.log('server up on port 8088'));