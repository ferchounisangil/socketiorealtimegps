var express = require('express');
var app = express();
var server = require('http').Server(app);
const port = 3000 || process.env.PORT;
var router = express.Router();
var path = require('path');
//app.use(express.static(path.join(__dirname,'/public')));
app.use('/static', express.static(__dirname + '/public'));
app.use('/bootstrap', express.static(__dirname + '/bootstrap'));
//app.use(express.static(__dirname + '/public'));
var session = require('express-session');
var mysql = require('mysql');
const morgan = require('morgan');
const exphbs = require('express-handlebars');
var moment = require('moment');
app.get('/informe',function(req,res) {
	res.sendFile(path.join(__dirname+'/public/informe.html'));
  });

app.use(require('./routes/insert'));
app.use(require('./routes/authentication'));
app.use('/insert', require('./routes/insert'));
app.use('/', require('./routes/insert'));
var bodyParser = require('body-parser');
var database = require('./controllers/database.js');

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

server.listen(port, function () {
	console.log('servidor corriendo en el puerto : ' + port);
})

app.post('/auth', function(request, response) {
	var username = request.body.username;
	var password = request.body.password;
	if (username && password) {
		connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.username = username;
				response.redirect('/home');
			} else {
				response.send('Incorrect Username and/or Password!');
			}			
			response.end();
		});
	} else {
		response.send('Please enter Username and Password!');
		response.end();
	}
});


app.get('/home', function(request, response) {
	if (request.session.loggedin) {
		response.send('Welcome back, ' + request.session.username + '!');
	} else {
		response.send('Por favor haga login para ver esta página');
	}
	response.end();
});



//////////// Creacion del servidor socket io
var SOCKET_MONITOR_ID=null;
var CLIENTES=[];//{id,socket_id}
var ID=null;
var io = require('socket.io').listen(server);

// Nueva conexiòn
io.on('connection', function (socket) {
	
	console.log('Nueva conexiòn de :' + socket.id);


	socket.on("loginMonitor",function(data,response){
		if(data.monitor="monitor"){	
			SOCKET_MONITOR_ID=socket.id;
			var info={id:socket.id};			   
			response(info);
		}	
	});
	socket.on("loginCliente",function(data,response){//data={id}
		var index=buscar(data);
		if(index===-1){//NO ENCONTRADO
			
			CLIENTES.push({id:data.id,socket_id:socket.id});
			var info={estado:1,id:data.id};			   
			response(info);
		}
		else{
			var info={estado:0,id:null};			   
			response(info);
		}
		
	});	
	socket.on("posicionClientes", function(data) //{ID,LAT,LON}
	{
		console.log(JSON.parse(JSON.stringify(data)));
		//console.log(data);
		if(SOCKET_MONITOR_ID!=null)
			io.sockets.connected[SOCKET_MONITOR_ID].emit('monitorPrincipal',data);
		//io.emit('monitorPrincipal',data);

	});	

	
	socket.on("posicionVehiculos", function() {
		database.getpunto().then(function(env) {

			env.forEach(element => {
				database.getpunto
				console.log("estoy en la promesa", element.idVehiculo,element.LONGITUDE,element.LATITUD,element.id); 
				var obj={};
				obj.id = element.nombre;
				obj.lon= element.LONGITUDE;
				obj.lat= element.LATITUD;
				if(SOCKET_MONITOR_ID!=null)
					io.sockets.connected[SOCKET_MONITOR_ID].emit('monitorPrincipal',obj);
			/*var fecha1 = moment('19:15:00', 'HH:mm:ss');
			var fecha2 = moment('09:45:30', 'HH:mm:ss');
			var segundos = fecha2.diff(fecha1,'seconds');
			console.log(segundos);
			console.log(moment.duration(segundos, "seconds").format("HH:mm:ss"));*/

		});
		}, function(Error) {
	console.log(Error); // Error!
	console.log(JSON.stringify(Error))
});
	});


	socket.on("reporteVehiculos", function(fechai,fechaf) {
		console.log(fechai,fechaf);
		database.getreporteVehiculos(fechai,fechaf).then(function(env) {	
			if(SOCKET_MONITOR_ID!=null)
				socket.emit('setReporteVehiculos',env);
		}, function(Error) {
	console.log(Error); // Error!
	console.log(JSON.stringify(Error))
});
	});

socket.on('asociar',function(fecha,vehiculo,getRutas){//data={id}
		database.insertasociacion(fecha,vehiculo,getRutas).then(function(env) {	
			if(SOCKET_MONITOR_ID!=null)
				socket.emit('asosiarResponse',env);
		}, function(Error) {
			socket.emit('asosiarResponse',Error);
});
	});

	socket.on("getVehiculosandrutas",function(){//data={id}
		database.getVehiculos().then(function(env) {	
			if(SOCKET_MONITOR_ID!=null)
				socket.emit('getVehiculos',env);
		}, function(Error) {
	console.log(Error); // Error!
	console.log(JSON.stringify(Error))
});

		database.getRutas().then(function(env) {	
			if(SOCKET_MONITOR_ID!=null)
				socket.emit('getRutas',env);
		}, function(Error) {
	console.log(Error); // Error!
	console.log(JSON.stringify(Error))
});

		
	});
	socket.on("reporteRutas", function(fechai,fechaf) {
		database.getreporteRutas(fechai,fechaf).then(function(env) {	
			if(SOCKET_MONITOR_ID!=null)
				socket.emit('setReporteRutas',env);
		}, function(Error) {
	console.log(Error); // Error!
	console.log(JSON.stringify(Error))
});
	});
	socket.on("reporte", function(fecha) {
		database.getreporte(fecha).then(function(env) {	
			if(SOCKET_MONITOR_ID!=null)
				socket.emit('setReporte',env);
		}, function(Error) {
	console.log(Error); // Error!
	console.log(JSON.stringify(Error))
});
	});



	socket.on("disconnect", function() {
		console.log('Clave Desconectada: '+socket.id);
		var n=CLIENTES.length;
		for(var i=0;i<n;i++){
			if(CLIENTES[i].socket_id==socket.id){

				if(SOCKET_MONITOR_ID!=null)
					io.sockets.connected[SOCKET_MONITOR_ID].emit('monitorPrincipalDisconnet',CLIENTES[i]);//EL CLIENTE DEBE SER BORRADO
				
				CLIENTES.splice(i, 1);//eliminamos el usuario				
				break;
			}
		}
	});
});

function buscar(data){
	var index=-1;		
	var n=CLIENTES.length;
	for(var i=0;i<n;i++){
		if(CLIENTES[i].id===data.id){
			index=i;
			break;
		}
	}			
	return index;			
}	



module.exports = {
	router,
	app
}