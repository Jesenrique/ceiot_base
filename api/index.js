const express = require("express");
const bodyParser = require("body-parser");
const {MongoClient} = require("mongodb");
const PgMem = require("pg-mem");

const db = PgMem.newDb();

    const render = require("./render.js");
// Measurements database setup and access

let database = null;
const collectionName = "measurements";

async function startDatabase() {
    const uri = "mongodb://localhost:27017/?maxPoolSize=20&w=majority";	
    const connection = await MongoClient.connect(uri, {useNewUrlParser: true});
    database = connection.db();
}

async function getDatabase() {
    if (!database) await startDatabase();
    return database;
}

async function insertMeasurement(message) {
    const {insertedId} = await database.collection(collectionName).insertOne(message);
    return insertedId;
}

async function getMeasurements() {
    return await database.collection(collectionName).find({}).toArray();	
}

// API Server

const app = express();

app.use(bodyParser.urlencoded({extended:false}));

app.use(express.static('spa/static'));

const PORT = 8080;

app.post('/measurement', express.json(), function (req, res) {
	console.log(req.body);
-   console.log("device id    : " + req.body.id + " key         : " + req.body.k + " temperature : " + req.body.t + " humidity    : " + req.body.h);	
    const {insertedId} = insertMeasurement({id:req.body.id, t:req.body.t, h:req.body.h,timestap:get_timestap()});
	res.send("received measurement into " +  insertedId);
});

app.post('/device', function (req, res) {
	console.log("device id    : " + req.body.id + " name        : " + req.body.n + " key         : " + req.body.k );
    db.public.none("INSERT INTO devices VALUES ('"+req.body.id+ "', '"+req.body.n+"', '"+req.body.k+"')");
	res.send("received new device");
});


// Ruta que requiere parseo JSON
app.post('/device-json', express.json(), function (req, res) {
    // req.body contendrá el objeto JSON parseado
    console.log(req.body);
    console.log("device id    : " + req.body.id + " name        : " + req.body.n + " key         : " + req.body.k );
    db.public.none("INSERT INTO devices VALUES ('"+req.body.id+ "', '"+req.body.n+"', '"+req.body.k+"')");
    res.send("received new device");
});


// Borrar dispositivo
app.delete('/delete', express.json(), function (req, res) {
    // req.body contendrá el objeto JSON parseado
	console.log(req.body)
	try{
    db.public.none("DELETE FROM devices WHERE device_id = '"+req.body.id+"'");
	res.send("Device was deleted");
	}
	catch(error){
	console.error("Error deleting device:", error);
    res.status(500).send("Error deleting device");
	}
});

//Actualizar dispositivo
app.put('/update', express.json(), function (req, res) {
    // req.body contendrá el objeto JSON parseado
    console.log(req.body);
    console.log("device id    : " + req.body.id + " name        : " + req.body.n + " key         : " + req.body.k );
    db.public.none("UPDATE devices SET name='" + req.body.n + "', key='" + req.body.k + "' WHERE device_id='" + req.body.id + "'");
    res.send("device update");
});

//obtener timestap
	const get_timestap = function() {
	const fecha = new Date();
	const timestamp = fecha .getTime();
	return timestamp;
};


app.get('/web/device', function (req, res) {
	var devices = db.public.many("SELECT * FROM devices").map( function(device) {
		console.log(device);
		return '<tr><td><a href=/web/device/'+ device.device_id +'>' + device.device_id + "</a>" +
			       "</td><td>"+ device.name+"</td><td>"+ device.key+"</td></tr>";
	   }
	);
	res.send("<html>"+
		     "<head><title>Sensores</title></head>" +
		     "<body>" +
		        "<table border=\"1\">" +
		           "<tr><th>id</th><th>name</th><th>key</th></tr>" +
		           devices +
		        "</table>" +
		     "</body>" +
		"</html>");
});

app.get('/web/device/:id', function (req,res) {
    var template = "<html>"+
                     "<head><title>Sensor {{name}}</title></head>" +
                     "<body>" +
		        "<h1>{{ name }}</h1>"+
		        "id  : {{ id }}<br/>" +
		        "Key : {{ key }}" +
                     "</body>" +
                "</html>";


    var device = db.public.many("SELECT * FROM devices WHERE device_id = '"+req.params.id+"'");
    console.log(device);
    res.send(render(template,{id:device[0].device_id, key: device[0].key, name:device[0].name}));
});	


app.get('/term/device/:id', function (req, res) {
    var red = "\33[31m";
    var green = "\33[32m";
    var blue = "\33[33m";
    var reset = "\33[0m";
    var template = "Device name " + red   + "   {{name}}" + reset + "\n" +
		   "       id   " + green + "       {{ id }} " + reset +"\n" +
	           "       key  " + blue  + "  {{ key }}" + reset +"\n";
    var device = db.public.many("SELECT * FROM devices WHERE device_id = '"+req.params.id+"'");
    console.log(device);
    res.send(render(template,{id:device[0].device_id, key: device[0].key, name:device[0].name}));
});

app.get('/measurement', async (req,res) => {
    res.send(await getMeasurements());
});

app.get('/device', function(req,res) {
    res.send( db.public.many("SELECT * FROM devices") );
});

startDatabase().then(async() => {

    const addAdminEndpoint = require("./admin.js");
    addAdminEndpoint(app, render);

    await insertMeasurement({id:'00', t:'18', h:'78', timestap:get_timestap()});
    await insertMeasurement({id:'00', t:'19', h:'77', timestap:get_timestap()});
    await insertMeasurement({id:'00', t:'17', h:'77', timestap:get_timestap()});
    await insertMeasurement({id:'01', t:'17', h:'77', timestap:get_timestap()});
    console.log("mongo measurement database Up");

    db.public.none("CREATE TABLE devices (device_id VARCHAR, name VARCHAR, key VARCHAR)");
    db.public.none("INSERT INTO devices VALUES ('00', 'Fake Device 00', '123456')");
    db.public.none("INSERT INTO devices VALUES ('01', 'Fake Device 01', '234567')");
    db.public.none("CREATE TABLE users (user_id VARCHAR, name VARCHAR, key VARCHAR)");
    db.public.none("INSERT INTO users VALUES ('1','Ana','admin123')");
    db.public.none("INSERT INTO users VALUES ('2','Beto','user123')");

    console.log("sql device database up");

    app.listen(PORT, () => {
        console.log(`Listening at ${PORT}`);
    });
});
