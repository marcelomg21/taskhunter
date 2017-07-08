//  OpenShift sample Node application
var express = require('express'),
    fs      = require('fs'),
    app     = express(),
    eps     = require('ejs'),
    morgan  = require('morgan'),
    jwt     = require('jsonwebtoken'),
    bodyParser = require('body-parser');
    
Object.assign=require('object-assign')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));
app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'))

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";

if (mongoURL == null && process.env.DATABASE_SERVICE_NAME) {
  var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase(),
      mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'],
      mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'],
      mongoDatabase = process.env[mongoServiceName + '_DATABASE'],
      mongoPassword = process.env[mongoServiceName + '_PASSWORD']
      mongoUser = process.env[mongoServiceName + '_USER'];

  if (mongoHost && mongoPort && mongoDatabase) {
    mongoURLLabel = mongoURL = 'mongodb://';
    if (mongoUser && mongoPassword) {
      mongoURL += mongoUser + ':' + mongoPassword + '@';
    }
    // Provide UI label that excludes user id and pw
    mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
    mongoURL += mongoHost + ':' +  mongoPort + '/' + mongoDatabase;

  }
}
var db = null,
    dbDetails = new Object();

var initDb = function(callback) {
  if (mongoURL == null) return;

  var mongodb = require('mongodb');
  if (mongodb == null) return;

  mongodb.connect(mongoURL, function(err, conn) {
    if (err) {
      callback(err);
      return;
    }

    db = conn;
    dbDetails.databaseName = db.databaseName;
    dbDetails.url = mongoURLLabel;
    dbDetails.type = 'MongoDB';
    db.collection('positions').ensureIndex( { location : "2dsphere" } );
    console.log('Connected to MongoDB at: %s', mongoURL);
  });
};

app.get('/', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    var col = db.collection('counts');
    // Create a document with request IP and current time of request
    col.insert({ip: req.ip, date: Date.now()});
    col.count(function(err, count){
      res.render('index.html', { pageCountMessage : count, dbInfo: dbDetails });
    });
  } else {
    res.render('index.html', { pageCountMessage : null});
  }
});

app.get('/pagecount', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    db.collection('counts').count(function(err, count ){
      res.send('{ pageCount: ' + count + '}');
    });
  } else {
    res.send('{ pageCount: -1 }');
  }
});

app.post('/api/position', function (req, res) {
  if(!req.body.name || !req.body.lat || !req.body.lon) {
     res.status(400).send('400 Bad Request')
  }
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    var col = db.collection('positions');
    //col.insert({position: req.body.name, date: Date.now()});
    //var point = {"type" : "Point", "coordinates" : [req.body.lat, req.body.lon]};
    col.insert({name: req.body.name, location: {type : 'Point', coordinates : [parseFloat(req.body.lat), parseFloat(req.body.lon)]}});    
  } 
  res.end();
});

app.get('/api/positions', function (req, res) {
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    //db.collection('positions').count(function(err, count ){
    //  res.send('{ position: ' + count + '}');
    //});
    var col = db.collection('positions');
    //var near = {"near": {"type": "Point","coordinates": [ -30.014234, -51.087205 ]}, "maxDistance": 0.09 * 1609,"spherical": true,"distanceField": "distance","distanceMultiplier": 0.000621371};
    //col.aggregate([{ '$geoNear' : {'near' : {'type': 'Point', 'coordinates' : [ -30.014234, -51.087205 ]}, 'maxDistance' : 0.09 * 1609, 'spherical' : true, 'distanceField' : 'distance', 'distanceMultiplier' : 0.000621371}}]).pretty();
    col.aggregate([
          { 
              $geoNear : {
                near : { type: 'Point', coordinates : [ -30.014234, -51.087205 ] }, 
                        maxDistance : 0.50 * 1609, 
                        spherical : true, 
                        distanceField : 'distance', 
                        distanceMultiplier : 0.000621371
              }
          }
      ], function(err, result) {
            return res.send(result);
        });    
  }
});

app.get('/api/position/:id', function (req, res) {
  res.send('param: ' + req.params.id);
});

app.get('/api/oauth2', function (req, res) {
    var tokenData = {
        username: 'marcelo.goncalves',
        id: '2145590999'
    };
    var result = {
        username: 'marcelo.goncalves',
        token: Jwt.sign(tokenData, '37LvDSm4XvjYOh9Y')
    };

    //return res.json(result);
    res.send('param: oauth2 success');
});

// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

initDb(function(err){
  console.log('Error connecting to Mongo. Message:\n'+err);
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;
