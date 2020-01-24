var mysql = require('mysql');
var connection = null;
var promise = require('promise');
var io = require('socket.io');
var moment = require('moment');
var momentDurationFormatSetup = require("moment-duration-format");


/*momentDurationFormatSetup(moment);
typeof moment.duration.fn.format === "function";
// true
typeof moment.duration.format === "function";
*/
/*
var pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'seguimiento'
})
pool.getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed.')
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Database has too many connections.')
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('Database connection was refused.')
        }
    }
    if (connection) connection.release()
    return
})
module.exports = pool

*/


var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'seguimiento'
}); 


/*var pool    =    mysql.createPool({
      connectionLimit   :   100,
      host              :   'localhost',
      user              :   'root',
      password          :   '',
      database          :   'seguimiento',
      debug             :   false
});
/*

/**
 * Función sólo para testear la BD
 */


 function databaseconnection() {


    connection.connect((err) => {

        if (err) {
            console.error('error: ' + err.stack)
            return;
        }
        else if (!err) {
            console.log('connection exitosa' + connection.threadId);
        }
    })

}


function login (){

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

}  

/*connection.end((err) => {
  // The connection is terminated gracefully
  // Ensures all previously enqueued queries are still
  // before sending a COM_QUIT packet to the MySQL server.
});
*/


/**
 * Función para insertar puntos en la BD
 * @param  {} lat latitud pasada por url
 * @param  {} long longitu pasada por url
 */

 function insertPoints(lat, long,id) {
    //console.log("INSERT POINT", lat, long,id)
    
    let point = `POINT(${lat} ${long})`;
    let query = `INSERT INTO gps(point,vehiculos_idvehiculo) SELECT ST_GeomFromText('${point}'),idvehiculo FROM vehiculos WHERE headers = '${id}' `;
   // console.log(query)
   connection.connect(function(err) {
    connection.query(query, (err, result, fields) => {
        if (!err) {
            var fecha = new Date();
            var dateahora = moment(fecha).format("YYYY-MM-DD");
            var timeahora = moment(fecha).format("HH:mm:ss");   
            let query = ` SELECT geo.idGeocerca,vh.idvehiculo,hr.rutas_idRuta, (6371000 * ACOS(SIN(RADIANS(geo.Latitud)) * SIN(RADIANS(${lat})) + COS(RADIANS(geo.Longitud - (${long}))) * COS(RADIANS(geo.Latitud)) * COS(RADIANS(${lat})))) AS distance,geo.Radio,gr.Hora_de_pasada 
            FROM geocercas geo, vehiculos vh , geocercas_has_rutas gr , historico_rutas hr
            WHERE vh.headers = '${id}' and vh.idvehiculo = hr.vehiculos_idvehiculo and hr.fecha = '${dateahora}'  and hr.rutas_idRuta = gr.rutas_idRuta and geo.idGeocerca = gr.Geocercas_idGeocerca HAVING distance < geo.Radio ORDER BY distance ASC LIMIT 1`;
            connection.query(query, (err, result, fields) => {
                if (!err) {
                    if(Object.keys(result).length!=0)
                    {
                        var consultaGeocerca = JSON.parse(JSON.stringify(result));


                    //console.log(consultaGeocerca);
                    //timehorapasada = moment.duration(consultaGeocerca[0].Hora_de_pasada, 'HH:mm:ss').format('HH:mm:ss');
                    var timehorapasada = moment(consultaGeocerca[0].Hora_de_pasada, 'HH:mm:ss');
                    var timehoraser = moment(fecha, 'HH:mm:ss');
                    var segundos = timehoraser.diff(timehorapasada,'seconds');
                    //console.log(moment.duration(timeahora.diff(timehorapasada)));
                    let query = ` SELECT idcontrol 
                    FROM controles  
                    WHERE fecha = '${dateahora}' 
                    AND vehiculos_idvehiculo = ${consultaGeocerca[0].idvehiculo} 
                    AND Rutas_idRuta = ${consultaGeocerca[0].rutas_idRuta} 
                    AND Geocercas_idGeocerca = ${consultaGeocerca[0].idGeocerca}`;
                    connection.query(query, (err, result, fields) => {
                        if (!err) {
                            if(Object.keys(result).length==0)
                            {
                                let query = ` 
                                INSERT INTO controles
                                (
                                vehiculos_idvehiculo,
                                fecha, 
                                Hora_de_buseta,
                                tiempo_control,
                                Rutas_idRuta,
                                Geocercas_idGeocerca) 
                                VALUES (
                                ${consultaGeocerca[0].idvehiculo} ,
                                '${dateahora}',
                                '${timeahora}',
                                ${segundos},
                                ${consultaGeocerca[0].rutas_idRuta},
                                ${consultaGeocerca[0].idGeocerca}
                                )`;
                                connection.query(query, (err, result, fields) => {
                                    if (!err) {
                                        console.log("inserte");
                                    }
                                    else if (err) {
                                        console.log(`error: ${err}`);
                                    }
                                });


                            }else
                            {
                                console.log("No inserte");
                            }

                        } else if (err) {
                            console.log(`error: ${err}`);
                        }
                    });
                }
                else
                {
                    console.log("No estoy dentro de geo");
                }
            } else if (err) {
                console.log(`error: ${err}`);
            }
        });
        } else if (err) {
            console.log(`error: ${err}`);
        }
    });
});
}


/**
 * Función para consultar a la BD
 */
 function insertasociacion(fecha,vehiculo,ruta)
 {
    return new Promise((resolve, reject) => {
        let query = ` SELECT vehiculos_idvehiculo 
        FROM historico_rutas  
        WHERE fecha = '${fecha}' 
        AND vehiculos_idvehiculo = ${vehiculo} 
        AND rutas_idRuta != ${ruta} `;
        connection.query(query, (err, result, fields) => {
            if (!err) {
                if(Object.keys(result).length==0)
                {

                    let query = ` 
                    INSERT INTO 
                    historico_rutas(
                    vehiculos_idvehiculo, rutas_idRuta, fecha) 
                    VALUES (${vehiculo},${ruta},'${fecha}') 
                    ON DUPLICATE KEY UPDATE vehiculos_idvehiculo = ${vehiculo} `;
                    connection.query(query, (err, result, fields) => {
                        if (!err) {
                            resolve(result.affectedRows);

                        } else if (err) {
                            console.log(`error: ${err}`);
                            reject(err);
                        }
                    });
                }else
                {
                    let query = ` 
                    UPDATE historico_rutas SET rutas_idRuta = ${ruta}
                    WHERE vehiculos_idvehiculo =  ${vehiculo} AND  fecha = '${fecha}'`;
                    connection.query(query, (err, result, fields) => {
                        if (!err) {
                            resolve(result.affectedRows);

                        } else if (err) {
                            console.log(`error: ${err}`);
                            reject(999);
                        }
                    });
                }

            } else if (err) {
                console.log(`error: ${err}`);
            }
        });
    });
}
function getVehiculos()
{
    return new Promise((resolve, reject) => {

        let query = `SELECT v.idvehiculo AS ID ,
        v.nombre as VEHICULO
        FROM vehiculos v`;

        connection.connect(function(err) {
            connection.query(query, (err, result, fields) => {
                if (!err) {
                    result.forEach(element => {

                    });
                    resolve(JSON.parse(JSON.stringify(result)));
           // console.log(JSON.stringify(result))
       } else if (err) {
        console.log(`error: ${err}`);
        reject(err);
    }
});
        });

    });

}

function getPoints() {
    // consulta de la db para traerse como objeto legible los puntos 
    //let query = `SELECT id, ST_AsText(point) AS POINT,  ST_X(point) AS LATITUD, ST_Y(point) AS LONGITUDE FROM gps;`;
    connection.query(`SELECT id, ST_AsText(point) AS POINT,  ST_X(point) AS LATITUD, ST_Y(point) AS LONGITUDE FROM gps`, function(error, results,fields){

        console.log(`results: ${result}`);
        result.forEach(element => {
            console.log(element);
        });

        connection.release();
    })
    if(err)
        console.log(`error: ${err}`);
}


function getRutas()
{
    return new Promise((resolve, reject) => {

        let query = `SELECT r.idRuta AS ID ,
        r.Descripcion AS RUTA
        FROM rutas r`;

        connection.connect(function(err) {
            connection.query(query, (err, result, fields) => {
                if (!err) {
                    result.forEach(element => {

                    });
                    resolve(JSON.parse(JSON.stringify(result)));
           // console.log(JSON.stringify(result))
       } else if (err) {
        console.log(`error: ${err}`);
        reject(err);
    }
});
        });

    });

}
function getreporte(fecha)
{
    return new Promise((resolve, reject) => {

        let query = `SELECT v.nombre as VEHICULO ,
        r.Descripcion AS RUTA, 
        g.Nombre AS CONTROL, 
        gr.Hora_de_pasada as HORAA , 
        c.Hora_de_buseta as HORAC , 
        c.tiempo_control as MINUTOS 
        FROM controles c 
        LEFT JOIN vehiculos v on v.idvehiculo = c.vehiculos_idvehiculo 
        LEFT JOIN rutas r on r.idRuta = c.Rutas_idRuta 
        LEFT JOIN geocercas g ON c.Geocercas_idGeocerca = g.idGeocerca 
        LEFT JOIN geocercas_has_rutas gr on gr.Geocercas_idGeocerca = g.idGeocerca AND gr.Rutas_idRuta = r.idRuta 
        WHERE fecha = '${fecha}'`;

        connection.connect(function(err) {
            connection.query(query, (err, result, fields) => {
                if (!err) {
                    result.forEach(element => {

                    });
                    resolve(JSON.parse(JSON.stringify(result)));
           // console.log(JSON.stringify(result))
       } else if (err) {
        console.log(`error: ${err}`);
        reject(err);
    }
});
        });

    });

}


function getreporteVehiculos(fechai,fechaf)
{
    return new Promise((resolve, reject) => {


        let query = `SELECT SUM(c.tiempo_control) as Minutos , v.nombre 
        FROM  vehiculos v 
        LEFT JOIN controles c ON v.idvehiculo = vehiculos_idvehiculo  
        WHERE c.fecha BETWEEN '${fechai}' AND '${fechaf}'
        GROUP BY v.nombre order by Minutos ASC `;

        connection.connect(function(err) {
            connection.query(query, (err, result, fields) => {
                if (!err) {
                    result.forEach(element => {

                    });
                    resolve(JSON.parse(JSON.stringify(result)));
           // console.log(JSON.stringify(result))
       } else if (err) {
        console.log(`error: ${err}`);
        reject(err);
    }
});
        });

    });

}
function getreporteRutas(fechai,fechaf)
{
    return new Promise((resolve, reject) => {


        let query = `SELECT SUM(c.tiempo_control) as Minutos , r.Descripcion as nombre
        FROM  rutas r
        LEFT JOIN controles c ON r.idRuta = c.Rutas_idRuta  
        WHERE c.fecha BETWEEN '${fechai}' AND '${fechaf}'
        GROUP BY r.Descripcion order by Minutos DESC`;

        connection.connect(function(err) {
            connection.query(query, (err, result, fields) => {
                if (!err) {
                    result.forEach(element => {

                    });
                    resolve(JSON.parse(JSON.stringify(result)));
           // console.log(JSON.stringify(result))
       } else if (err) {
        console.log(`error: ${err}`);
        reject(err);
    }
});
        });

    });

}


function getpunto () {
    return new Promise((resolve, reject) => {

        let query = `SELECT ve.idVehiculo , ST_X(gp.point) AS LATITUD, ST_Y(gp.point) AS LONGITUDE, ve.nombre, gp.id FROM vehiculos as ve , gps as gp WHERE gp.vehiculos_idvehiculo= ve.idvehiculo AND gp.id = (SELECT MAX(gpso.id) FROM gps as gpso where gpso.vehiculos_idvehiculo = ve.idvehiculo);`;

        connection.connect(function(err) {
            connection.query(query, (err, result, fields) => {
                if (!err) {
                    result.forEach(element => {

                    });
                    resolve(JSON.parse(JSON.stringify(result)));
           // console.log(JSON.stringify(result))
       } else if (err) {
        console.log(`error: ${err}`);
        reject(err);
    }
});
        });

    });
}  


module.exports = {
    insertPoints,
    getPoints,
    getpunto,
    getreporte,
    getreporteVehiculos,
    getreporteRutas,
    getVehiculos,
    getRutas,
    insertasociacion

} 
