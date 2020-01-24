var express = require('express');
var router = express.Router();
const database = require('../controllers/database');
var path = require('path');
router.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

function test(req,res,next) {
    console.log("pasaste por el midleware");
    next();
}
router.use(test);


router.get('/test', function(request, response) {
    response.render(path.join(__dirname + '../public/index.html'));
    console.log(__dirname);
});



router.use('/gps', (req, res, next) => {

    let id = req.headers["user-agent"];
    let {lon, lat} = req.query;
    if(lat!=undefined && lon!=undefined)
    {

        database.insertPoints(lat, lon, id);

        console.log(`identificador: ${id}`);

    }
    else
    {
        console.log(`Error de coordenada`);        
    }

    next();
})

router.use('/*', (req,res) => {

    res.send("esta rutua no existe");
})

module.exports = router;