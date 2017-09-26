//  OpenShift sample Node application
var express = require('express'),
    fs      = require('fs'),
    app     = express(),
    eps     = require('ejs'),
    morgan  = require('morgan'),
    jwt     = require('jsonwebtoken'),
    assert = require('assert'),
    bodyParser = require('body-parser');
    
Object.assign=require('object-assign');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'));

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

app.post('/connect/oauth/token', function (req, res) {
        
    var tokenData = {
        username: 'marcelo.goncalves',
        id: '1520675761317155'
    };
    var result = {        
        access_token: jwt.sign(tokenData, 'fb106701ca07d55d53e66648b2cc2d4a'),
        expires_in: 86400,        
        scope: 'achievement_type_read countries_read language_read locale_read pack_read subscription_type_read report_type_read user_mode_read notification_type_read search_user all_user_read all_image_read user_device_create user_device_read user_device_update user_device_delete user_position_read user_position_update user_notifications_read user_poke_create user_message_create user_message_read user_message_update user_message_delete user_image_create user_image_read user_image_update user_image_delete user_conversation_create user_conversation_read user_conversation_update user_conversation_delete user_order_create user_order_read user_order_update user_applications_read user_applications_update user_applications_delete user_blocked_read user_blocked_create user_blocked_delete user_accepted_read user_accepted_create user_accepted_delete user_rejected_read user_rejected_create user_rejected_delete user_subscription_create user_subscription_read user_subscription_update user_subscription_delete user_achievement_create user_achievement_read user_achievement_update user_achievement_delete user_availability_create user_availability_read user_availability_update user_availability_delete user_social_create user_social_read user_social_update user_social_delete user_update user_delete user_read user_report_read user_report_create user_report_update user_report_delete',
        user_id: '1520675761317155',
        is_new: false,
        refresh_token: '43p0v5m203kd9333goafve2qe9idqp0707'
    };

    return res.json(result);
});

app.get('/api/users/:user_id', function (req, res) {
  var result = {
          data: {
              id: req.params.user_id,
              age: 33,        
              first_name: 'Marcelo',
              gender: 'male',
              register_date: '2010-07-16',
              birth_date: '1980-07-16',
              matching_preferences: { age_max: 30, age_min: 20, female:1, male: 0 },
              notification_settings: { charms: 0, match: 0, messages:0 },
              stats: { nb_invites: 0, nb_charms: 0, nb_crushes: 0 },
              job: 'Engenheiro Civil',
              nb_photos: 0,
              credits: 0,
              unread_conversations: 0,
              unread_notifications: 0
          }        
    };
    
    return res.json(result);    
});

//add new message
app.post('/api/conversations/:conversation_id/messages/', function (req, res) {
  if(!req.body.message || !req.body.sender) {
     res.status(400).send('400 Bad Request')
  }
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    var col = db.collection('messages');
    
    var date = new Date();
    date.setHours(date.getHours() - 3);
    var dateFormat = date.toISOString().split('T')[0];
      
    col.insert({conversation_id: req.params.conversation_id, message: req.body.message, sender: req.body.sender, creation_date: dateFormat});    
  } 
  
  var result =  {
         success: true,
         data: {
              id: req.params.conversation_id,
              message: req.body.message,
              creation_date: dateFormat,
              sender: { 
                  id: 305,                  
                  first_name: 'Antônio Almir',
                  age: 30,
                  profiles: [{
                      id: 132,
                      mode: 0,
                      url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQaRre-rD2x077_NvY7d5cmy1UQ1oaeD7f5S2v30VTojvHpIbC7TA',
                      width: 50,
                      height: 50
                  }]
              },
              clickable_profile_link: false,
              clickable_message_link: false
          }
   };
        
    res.json(result);
});

//get messages
app.get('/api/conversations/:conversation_id/messages/', function (req, res) {
  /*var result = {
          success: true,
          data: [{
              id: 1,
              message: 'Boa noite, gostaria de um orçamento para a troca do Chuveiro?',
              creation_date: '2017-01-17',
              sender: { 
                  id: 102,                  
                  first_name: 'Moacir',
                  age: 30,
                  profiles: [{
                      id: 102,
                      mode: 0,
                      
                      width: 50,
                      height: 50
                  }]
              },
              clickable_profile_link: false,
              clickable_message_link: false
          },          
          {
              id: 3,
              message: 'Sim, são 50.00',
              creation_date: '2017-01-17',
              sender: { 
                  id: 1520675761317155,                  
                  first_name: 'Marcelo',
                  age: 30,
                  profiles: [{
                      id: 102,
                      mode: 0,
                      
                      width: 50,
                      height: 50
                  }]
              },
              clickable_profile_link: false,
              clickable_message_link: false
          }]
    };*/
    
    var query = {
        conversation_id: req.params.conversation_id
    };

    db.collection('messages').find(query).toArray(function (err, docs) {
        
        var result = {
              success: true,
              data: []
        };

        for (var i = 0, len = docs.length; i < len; i++) {              
            var item = {
                  id: docs[i]._id,
                  message: docs[i].message,
                  creation_date: docs[i].creation_date,
                  sender: { 
                      id: docs[i].sender,
                      first_name: 'XXXXXX',
                      age: 30
                  }
            };
            result.data.push(item);
        }

        return res.json(result);
    } );
});

//get conversation by user
app.get('/api/users/:user_id/conversations/:conversation_id', function (req, res) {
  var result = {
          success: true,
          data: [{
              id: 1,
              message: 'Boa noite, gostaria de um orçamento para a troca do Chuveiro?',
              creation_date: '2017-01-17',
              real_participants: [{ 
                      id: 1023,                  
                      first_name: 'Moacir',
                      age: 30,
                      profiles: [{
                          id: 102,
                          mode: 0,

                          width: 50,
                          height: 50
                      }]
                  },
                  { 
                  id: 1520675761317155,                  
                  first_name: 'Marcelo',
                  age: 30,
                  profiles: [{
                      id: 102,
                      mode: 0,
                      
                      width: 50,
                      height: 50
                  }]
              }]              
          }]
    };
                 
    return res.json(result);
    
    /*var query = {
        conversation_id: req.params.conversation_id
    };

    db.collection('messages').find(query).toArray(function (err, docs) {
        
        var result = {
              success: true,
              data: []
        };

        for (var i = 0, len = docs.length; i < len; i++) {              
            var item = {
                  id: docs[i]._id,
                  message: docs[i].message,
                  creation_date: docs[i].creation_date,
                  sender: { 
                      id: docs[i].sender,
                      first_name: 'XXXXXX',
                      age: 30
                  }
            };
            result.data.push(item);
        }

        return res.json(result);
    } );*/
});

//get read messages
app.put('/api/conversations/:conversation_id/messages', function (req, res) {
  var result = {
          success: true,
          data: {
              id: req.params.conversation_id,              
          }
    };
    
    return res.json(result);
});

app.get('/api/users/:user_id/crossings', function (req, res) {
  var result =  {
           success: true,
           data: [{
              id: req.params.user_id,              
              modification_date: '2017-07-05',
              notification_type: '471,524,525,526,529,530,531,565,791,792',
              notifier: { 
                  id: 303, 
                  type: 'type',
                  job: 'Serviços Gerais',
                  is_accepted: true,
                  workplace: '\nEletricista\nPintor\nEncanador\nTroca de Chuveiro\nColocação Basalto',
                  my_relation: 1,
                  distance: 20.90,
                  gender: 'F',
                  is_charmed: false,
                  nb_photos: 1,
                  first_name: 'Carlos Alberto',
                  age: 31,
                  already_charmed: false,
                  has_charmed_me: false,
                  availability: {
                      time_left: 100,
                      availability_type: {
                          color: '#FF4E00',
                          duration: 10,
                          label: 'label2',
                          type: 'type2'
                      }
                  },
                  last_meet_position: {
                      creation_date: '2017-08-15',
                      lat: -30.061004,
                      lon: -51.190147
                  },
                  is_invited: false,
                  last_invite_received: {
                      color: '#FF4E00',
                          duration: 20,
                          label: 'label3',
                          type: 'type3'
                  },
                  profiles: [{
                      id: 131,
                      mode: 0,
                      
                      width: 50,
                      height: 50
                  },
                  {
                      id: 167,
                      mode: 0,
                      url: 'https://pintoresdeparedesemfortaleza.files.wordpress.com/2016/08/pintura.jpg?w=1000',
                      width: 50,
                      height: 50
                  }]
              }
          },
          {
              id: req.params.user_id,              
              modification_date: '2017-07-05',
              notification_type: '471,524,525,526,529,530,531,565,791,792',
              notifier: { 
                  id: 305, 
                  type: 'type',
                  job: 'Eletricista',
                  is_accepted: true,
                  workplace: 'Manutenção Geral\nMóveis\Automóvel',
                  my_relation: 1,
                  distance: 20.90,
                  gender: 'M',
                  is_charmed: false,
                  nb_photos: 1,
                  first_name: 'Antônio',
                  age: 48,
                  already_charmed: false,
                  has_charmed_me: false,
                  availability: {
                      time_left: 100,
                      availability_type: {
                          color: '#FF4E00',
                          duration: 10,
                          label: 'label2',
                          type: 'type2'
                      }
                  },
                  is_invited: false,
                  last_invite_received: {
                      color: '#FF4E00',
                          duration: 20,
                          label: 'label3',
                          type: 'type3'
                  },
                  profiles: [{
                      id: 132,
                      mode: 0,
                      
                      width: 50,
                      height: 50
                  }]
              }
          },
          {
              id: req.params.user_id,              
              modification_date: '2017-07-05',
              notification_type: '471,524,525,526,529,530,531,565,791,792',
              notifier: { 
                  id: 306, 
                  type: 'type',
                  job: 'Marceneiro',
                  is_accepted: true,
                  workplace: 'Móveis Sob Medida\nReparos\nConcertos',
                  my_relation: 1,
                  distance: 20.90,
                  gender: 'F',
                  is_charmed: false,
                  nb_photos: 1,
                  first_name: 'Otávio Augusto',
                  age: 34,
                  already_charmed: false,
                  has_charmed_me: false,
                  availability: {
                      time_left: 100,
                      availability_type: {
                          color: '#FF4E00',
                          duration: 10,
                          label: 'label2',
                          type: 'type2'
                      }
                  },
                  is_invited: false,
                  last_invite_received: {
                      color: '#FF4E00',
                          duration: 20,
                          label: 'label3',
                          type: 'type3'
                  },
                  profiles: [{
                      id: 133,
                      mode: 0,
                      
                      width: 50,
                      height: 50
                  }]
              }
          },
          {
              id: req.params.user_id,              
              modification_date: '2017-07-05',
              notification_type: '471,524,525,526,529,530,531,565,791,792',
              notifier: { 
                  id: 307, 
                  type: 'type',
                  job: 'Carpinteiro',
                  is_accepted: true,
                  workplace: 'Móveis Sob Medida\nReparos\nConcertos',
                  my_relation: 1,
                  distance: 20.90,
                  gender: 'F',
                  is_charmed: false,
                  nb_photos: 1,
                  first_name: 'Joãozinho Terror',
                  age: 34,
                  already_charmed: false,
                  has_charmed_me: false,
                  availability: {
                      time_left: 100,
                      availability_type: {
                          color: '#FF4E00',
                          duration: 10,
                          label: 'label2',
                          type: 'type2'
                      }
                  },
                  is_invited: false,
                  last_invite_received: {
                      color: '#FF4E00',
                          duration: 20,
                          label: 'label3',
                          type: 'type3'
                  },
                  profiles: [{
                      id: 137,
                      mode: 0,
                      
                      width: 50,
                      height: 50
                  }]
              }
          },
          {
              id: req.params.user_id,              
              modification_date: '2017-07-05',
              notification_type: '471,524,525,526,529,530,531,565,791,792',
              notifier: { 
                  id: 308, 
                  type: 'type',
                  job: 'Jardineiro',
                  is_accepted: true,
                  workplace: 'Reparos Jardim\nCorte Grama\nConcertos',
                  my_relation: 1,
                  distance: 20.90,
                  gender: 'F',
                  is_charmed: false,
                  nb_photos: 1,
                  first_name: 'Amásio Mazzaropi',
                  age: 34,
                  already_charmed: false,
                  has_charmed_me: false,
                  availability: {
                      time_left: 100,
                      availability_type: {
                          color: '#FF4E00',
                          duration: 10,
                          label: 'label2',
                          type: 'type2'
                      }
                  },
                  is_invited: false,
                  last_invite_received: {
                      color: '#FF4E00',
                          duration: 20,
                          label: 'label3',
                          type: 'type3'
                  },
                  profiles: [{
                      id: 138,
                      mode: 0,
                      
                      width: 50,
                      height: 50
                  }]
              }
          },
          {
              id: req.params.user_id,              
              modification_date: '2017-07-05',
              notification_type: '471,524,525,526,529,530,531,565,791,792',
              notifier: { 
                  id: 309, 
                  type: 'type',
                  job: 'Técnico',
                  is_accepted: true,
                  workplace: 'Geladeira\nFogão\nMicroondas\nMáquina de Lavar',
                  my_relation: 1,
                  distance: 20.90,
                  gender: 'F',
                  is_charmed: false,
                  nb_photos: 1,
                  first_name: 'João Roberto Silva',
                  age: 51,
                  already_charmed: false,
                  has_charmed_me: false,
                  availability: {
                      time_left: 100,
                      availability_type: {
                          color: '#FF4E00',
                          duration: 10,
                          label: 'label2',
                          type: 'type2'
                      }
                  },
                  is_invited: false,
                  last_invite_received: {
                      color: '#FF4E00',
                          duration: 20,
                          label: 'label3',
                          type: 'type3'
                  },
                  profiles: [{
                      id: 139,
                      mode: 0,
                      
                      width: 50,
                      height: 50
                  }]
              }
          }]
    };
    
    
    return res.json(result);    
});

app.get('/api/users/:user_id/notifications', function (req, res) {
  var result =  {
           success: true,
           data: [{
              id: req.params.user_id,              
              modification_date: '2017-07-20',
              is_notified: false,
              type: '471',
              nb_times: 0,
              notification_type: '471,524,525,526,529,530,531,565,791,792',
              notifier: { 
                  id: 30, 
                  type: 'type',
                  first_name: 'Claudio',
                  gender: 'F',
                  my_relation: 0,
                  has_charmed_me: false,
                  age: 43,
                  already_charmed: false,
                  has_charmed_me: false,
                  availability: {
                      time_left: 100,
                      availability_type: {
                          color: '#FF4E00',
                          duration: 10,
                          label: 'label2',
                          type: 'type2'
                      }
                  },
                  is_invited: false,
                  last_invite_received: {
                      color: '#FF4E00',
                          duration: 20,
                          label: 'label3',
                          type: 'type3'
                  },
                  profiles: [{
                      id: 130,
                      mode: 0,
                      url: 'https://br.habcdn.com/photos/business/big/manutencao-predial_257993.jpg',
                      width: 50,
                      height: 50
                  }]
              }
          }]
    };
        
    return res.json(result);    
});

app.get('/api/users/:user_id/conversations', function (req, res) {
  var result =  {
           success: true,
           data: [{
              id: req.params.user_id,              
              modification_date: '2017-07-22',
              is_read: false,
              creation_date: '2017-07-20',
              last_message: {
                  creation_date: '2017-07-21',
                  message: 'This is a new message',
                  sender: {
                      id: 102, 
                      type: 'type1',
                      first_name: 'Moacir',
                      gender: 'M'
                  }
              },
              real_participants: [{
                  id: 304, 
                  type: 'type1',
                  first_name: 'Maciel Orlando',
                  gender: 'F'
              }],
              participants: [{                  
                  id: 1234,
                  user: {
                      id: 102, 
                      type: 'type1',
                      first_name: 'Moacir',
                      is_moderator: false,
                      profiles: [{
                          id: 102,
                          mode: 0,
                          url: 'https://br.habcdn.com/photos/business/big/manutencao-predial_257993.jpg',
                          width: 50,
                          height: 50
                      }]
                  }
              }]              
          }]
    };
        
    return res.json(result);    
});

//device set position
app.put('/api/users/:user_id/devices/:device_id/position', function (req, res) {
  if(!req.body.alt || !req.body.latitude || !req.body.longitude) {
     res.status(400).send('400 Bad Request')
  }
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    var col = db.collection('positions');
    //col.insert({position: req.body.name, date: Date.now()});
    //var point = {"type" : "Point", "coordinates" : [req.body.lat, req.body.lon]};
    col.insert({user_id: req.params.user_id, location: {type : 'Point', coordinates : [parseFloat(req.body.latitude), parseFloat(req.body.longitude)]}});    
  } 
  res.end();
});

//save new device
app.post('/api/users/:user_id/devices/', function (req, res) {
  if(!req.body.android_id) {
     res.status(400).send('400 Bad Request - ERRO SAVE NEW')
  }
    
  if (!db) {
    initDb(function(err){});
  }
  
  if (db) {
    var col = db.collection('devices');
    //col.insert({position: req.body.name, date: Date.now()});
    //var point = {"type" : "Point", "coordinates" : [req.body.lat, req.body.lon]};
    col.insert(
        {
            user_id: req.params.user_id, 
            device: {
                device_id: req.params.user_id + '_' + req.body.android_id,                
                androidId : req.body.android_id,
                appBuild : req.body.app_build,
                countryId : req.body.country_id,                
                languageId : req.body.language_id,
                osBuild : req.body.os_build,
                token : req.body.token,
                type : req.body.type
            }
        });    
  } 
  
  var result =  {
         success: true,
         data: {
             id: req.params.user_id + '_' + req.body.android_id
         }
   };
        
    res.json(result);
});

//update device
app.put('/api/users/:user_id/devices/:device_id', function (req, res) {
  
  if(!req.body.android_id) {
     res.status(400).send('400 Bad Request - ERRO UPDATE')
  }
    
  if (!db) {
    initDb(function(err){});
  }
  
  if (db) {
    var col = db.collection('devices');
    //col.insert({position: req.body.name, date: Date.now()});
    //var point = {"type" : "Point", "coordinates" : [req.body.lat, req.body.lon]};
    col.insert(
        {
            user_id: req.params.user_id, 
            device: {
                device_id: req.params.device_id,                
                androidId : req.body.android_id,
                appBuild : req.body.app_build,
                countryId : req.body.country_id,                
                languageId : req.body.language_id,
                osBuild : req.body.os_build,
                token : req.body.token,
                type : req.body.type
            }
        });    
  } 
    
  var result =  {
         success: true,
         data: {
             id: req.params.device_id
         }
   };
        
    res.json(result);
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
