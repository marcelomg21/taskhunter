//  OpenShift sample Node application
var express = require('express'),
    fs      = require('fs'),
    app     = express(),
    eps     = require('ejs'),
    morgan  = require('morgan'),
    jwt     = require('jsonwebtoken'),
    assert = require('assert'),
    request = require('request-promise'),
    firebase = require('firebase-admin'),
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

//firebase FCM
var API_KEY = "AIzaSyDZyILex2S1s6UpHyHG6d7HYON7hxOQ4g0"; // Your Firebase Cloud Messaging Server API key

// Fetch the service account key JSON file contents
var serviceAccount = require("./serviceAccountKey.json");

// Initialize the app with a service account, granting admin privileges
firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: "https://taskhunterapp.firebaseio.com"
});
ref = firebase.database().ref();

/*function listenForNotificationRequests() {
  var requests = ref.child('notificationRequests');
  requests.on('child_added', function(requestSnapshot) {
    var request = requestSnapshot.val();
    sendNotificationToUser(
      request.username, 
      request.message,
      function() {
        requestSnapshot.ref.remove();
      }
    );
  }, function(error) {
    console.error(error);
  });
};

function sendNotificationToUser(username, message, onSuccess) {
  request({
    url: 'https://fcm.googleapis.com/fcm/send',
    method: 'POST',
    headers: {
      'Content-Type' :' application/json',
      'Authorization': 'key='+API_KEY
    },
    body: JSON.stringify({
      notification: {
        title: message
      },
      to : '/topics/user_'+username
    })
  }, function(error, response, body) {
    if (error) { console.error(error); }
    else if (response.statusCode >= 400) { 
      console.error('HTTP Error: '+response.statusCode+' - '+response.statusMessage); 
    }
    else {
      onSuccess();
    }
  });
}

// start listening
listenForNotificationRequests();*/

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
    
    if(!req.body.client_id || !req.body.assertion) {
        res.status(400).send('400 Bad Request')
    }
 
    const user_field_set = 'id,name,first_name,gender,birthday,email,location,picture';

    const options = {
        method: 'GET',
        uri: 'https://graph.facebook.com/me',
        qs: {
          access_token: req.body.assertion,
          fields: user_field_set
        }
    };
    
    request(options)
    .then(fbRes => {
        var facebook_json = JSON.parse(fbRes);        
                
        if (!db) {
            initDb(function(err){});
        }
        
        if (db) {
           var col = db.collection('users');
            
            var query = {
                user_id: parseInt(facebook_json.id)
            };

            db.collection('users').find(query).toArray(function (err, docs) {

                if (docs.length <= 0) {
                    
                    var tokenData = {
                        facebook_access_token: req.body.assertion,
                        client_id: req.body.client_id
                    };

                    var jwt_access_token = jwt.sign(tokenData, 'fb106701ca07d55d53e66648b2cc2d4a');
                    
                    col.insert({
                           user_id: parseInt(facebook_json.id),
                           user_name: facebook_json.first_name, 
                           full_user_name: facebook_json.name,
                           gender: facebook_json.gender, 
                           email: facebook_json.email,
                           location: facebook_json.location,
                           access_token: jwt_access_token,
                           facebook_access_token: req.body.assertion,
                           facebook_picture: facebook_json.picture.data.url
                    });
                    
                    var result = {        
                        access_token: jwt_access_token,
                        expires_in: 86400,        
                        scope: 'achievement_type_read countries_read language_read locale_read pack_read subscription_type_read report_type_read user_mode_read notification_type_read search_user all_user_read all_image_read user_device_create user_device_read user_device_update user_device_delete user_position_read user_position_update user_notifications_read user_poke_create user_message_create user_message_read user_message_update user_message_delete user_image_create user_image_read user_image_update user_image_delete user_conversation_create user_conversation_read user_conversation_update user_conversation_delete user_order_create user_order_read user_order_update user_applications_read user_applications_update user_applications_delete user_blocked_read user_blocked_create user_blocked_delete user_accepted_read user_accepted_create user_accepted_delete user_rejected_read user_rejected_create user_rejected_delete user_subscription_create user_subscription_read user_subscription_update user_subscription_delete user_achievement_create user_achievement_read user_achievement_update user_achievement_delete user_availability_create user_availability_read user_availability_update user_availability_delete user_social_create user_social_read user_social_update user_social_delete user_update user_delete user_read user_report_read user_report_create user_report_update user_report_delete',            
                        user_id: parseInt(facebook_json.id),
                        is_new: false,
                        refresh_token: '43p0v5m203kd9333goafve2qe9idqp0707'
                    };
                    
                    return res.json(result);
                    
                } else {
                    
                    var result = {        
                        access_token: docs[0].access_token,
                        expires_in: 86400,        
                        scope: 'achievement_type_read countries_read language_read locale_read pack_read subscription_type_read report_type_read user_mode_read notification_type_read search_user all_user_read all_image_read user_device_create user_device_read user_device_update user_device_delete user_position_read user_position_update user_notifications_read user_poke_create user_message_create user_message_read user_message_update user_message_delete user_image_create user_image_read user_image_update user_image_delete user_conversation_create user_conversation_read user_conversation_update user_conversation_delete user_order_create user_order_read user_order_update user_applications_read user_applications_update user_applications_delete user_blocked_read user_blocked_create user_blocked_delete user_accepted_read user_accepted_create user_accepted_delete user_rejected_read user_rejected_create user_rejected_delete user_subscription_create user_subscription_read user_subscription_update user_subscription_delete user_achievement_create user_achievement_read user_achievement_update user_achievement_delete user_availability_create user_availability_read user_availability_update user_availability_delete user_social_create user_social_read user_social_update user_social_delete user_update user_delete user_read user_report_read user_report_create user_report_update user_report_delete',            
                        user_id: docs[0].user_id,
                        is_new: false,
                        refresh_token: '43p0v5m203kd9333goafve2qe9idqp0707'
                    };
                    
                    return res.json(result);
                }
            } );
        }
    });
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
              service_matching_preferences: {
                  pintura_service: {
                      grade: 1,
                      alvenaria: 0,
                      madeira: 1,
                      textura: 0,
                      grafiato: 1
                  }
              },
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

// service matching preferences
app.put('/api/users/:user_id/service/matching/preferences', function (req, res) {
    
  if(!req.body.pintura_service) {
     res.status(400).send('400 Bad Request')
  }
  
  console.log('req.body.pintura_service --> ' + req.body.pintura_service);
  console.log('req.body.pintura_service.grade --> ' + req.body.pintura_service.grade);
    
  var result = {
      success: true,
      data: {               
          id: req.params.user_id, 	
              service_matching_preferences: {
                  pintura_service: {
                      grade: req.body.pintura_service.grade,
                      alvenaria: req.body.pintura_service.alvenaria,
                      madeira: req.body.pintura_service.madeira,
                      textura: req.body.pintura_service.textura,
                      grafiato: req.body.pintura_service.grafiato
                  }
              }
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
      
    col.insert({conversation_id: req.params.conversation_id, message: req.body.message, sender: req.body.sender, recipient: req.body.recipient, creation_date: dateFormat});
      
    var query = {
        user_id: req.body.recipient
    };

    db.collection('devices').find(query).toArray(function (err, docs) {
        
        var firebase_token = "";

        for (var i = 0, len = docs.length; i < len; i++) {
            if (docs[i].user_id == req.body.recipient) {
                firebase_token = docs[i].device.firebase_token;
                break;
            }            
        }

        if (firebase_token != "") {
              //send FCM message
              // This registration token comes from the client FCM SDKs.
              //var registrationToken = "d0Y999GwJLQ:APA91bFikkfLd5BwD3yW15pn1oxnR3o1bRY05lVHlH1lldAJNvuM95tF66xgi-1KnkD4nwzY09ofLe1R9TSJOO-gWDbJh8cnd0uk6xph1aI_Dm5RRPXJzpXHbMZVa9oRwH299OnHYtad";
              var registrationToken = firebase_token;

              // See the "Defining the message payload" section below for details
              // on how to define a message payload.
              var payload = {
                  data: {
                    notification_key: "SENT_MESSAGE",
                    message: "",
                    notification_custom_data: "{ag-id: " + req.body.sender + ", view-id:" + req.params.conversation_id + " }"
                  }
              };

              // Send a message to the device corresponding to the provided
              // registration token.
              firebase.messaging().sendToDevice(registrationToken, payload)
                  .then(function(response) {
                    // See the MessagingDevicesResponse reference documentation for
                    // the contents of response.
                    console.log("Successfully sent message:", response);
                  })
                  .catch(function(error) {
                    console.log("Error sending message:", error);
              });              
        }              
    } );
      
    var result =  {
             success: true,
             data: {
                  id: req.params.conversation_id,
                  message: req.body.message,
                  creation_date: dateFormat,
                  sender: { 
                      id: req.body.sender,
                      //first_name: 'Antônio Almir',
                      //age: 30,
                      profiles: [{
                          id: req.body.sender,
                          mode: 0,
                          //url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQaRre-rD2x077_NvY7d5cmy1UQ1oaeD7f5S2v30VTojvHpIbC7TA',
                          width: 50,
                          height: 50
                      }]
                  }
              }
       };

       res.json(result);      
  }      
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
                      //first_name: 'XXXXXX',
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
          data: {
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
          }
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

//get all crossings
app.get('/api/users/:user_id/crossings', function (req, res) {
    /*var result =  {
           success: true,
           data: [{
              id: req.params.user_id,              
              modification_date: '2017-07-05',
              notification_type: '471,524,525,526,529,530,531,565,791,792',
              notifier: { 
                  id:103624497059053, 
                  type: 'type',
                  job: 'Serviços Gerais',
                  is_accepted: true,
                  workplace: '\nEletricista\nPintor\nEncanador\nTroca de Chuveiro\nColocação Basalto',
                  my_relation: 1,
                  distance: 20.90,
                  gender: 'F',
                  is_charmed: false,
                  nb_photos: 1,
                  first_name:'Kandida',
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
                      url: 'https://scontent.xx.fbcdn.net/v/t1.0-1/p50x50/22089386_105833976838105_2430462272889869880_n.jpg?oh=8f629c7dabb42a36c8e9f29646c35b1a&oe=5A8294ED',
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
                  id:1520675761317155, 
                  type: 'type',
                  job: 'Eletricista',
                  is_accepted: true,
                  workplace: 'Manutenção Geral\nMóveis\Automóvel',
                  my_relation: 1,
                  distance: 20.90,
                  gender: 'M',
                  is_charmed: false,
                  nb_photos: 1,
                  first_name:'Marcelo',
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
        
    return res.json(result);*/
        
    if(!req.params.user_id) {
        res.status(400).send('400 Bad Request')
    }

    if (!db) {
        initDb(function(err){});
    }

    if (db) {
        
        var result = {
              success: true,
              data: []
        };
                                        
        //get all user_id crossings
        db.collection('crossings').aggregate([
            {$unwind:'$crossings'}, 
            {$group:{_id:'$user_id', crossings:{'$addToSet':'$crossings'} } }, 
            {$unwind:'$crossings'}, 
            {$lookup:{from:'users', localField:'crossings', foreignField:'user_id', as:'crossingsObjects'} }, 
            {$unwind:'$crossingsObjects'}, {$group:{_id:'$_id', crossings:{'$push':'$crossingsObjects'} } }, 
            {$match:{$and:[{'_id':parseInt(req.params.user_id)}]} }]).toArray(function (err, docs_crossings) {

                console.log("docs_crossings.length: " + docs_crossings.length);

                if (docs_crossings.length > 0) {

                    for (var index_docs_crossings = 0, len_docs_crossings = docs_crossings[0].crossings.length; index_docs_crossings < len_docs_crossings; index_docs_crossings++) {

                        var item_crossings = {
                              id: parseInt(req.params.user_id),
                              //modification_date: docs_crossings[index_docs_crossings].timestamp.split('T')[0],
                              notification_type: '471,524,525,526,529,530,531,565,791,792',
                              notifier: { 
                                  id: docs_crossings[0].crossings[index_docs_crossings].user_id, 
                                  type: 'client',
                                  job: 'Serviços Gerais',
                                  is_accepted: true,
                                  workplace: '\nEletricista\nPintor\nEncanador\nTroca de Chuveiro\nColocação Basalto',
                                  my_relation: 1,
                                  //distance: 20.90,
                                  gender: docs_crossings[0].crossings[index_docs_crossings].gender,
                                  is_charmed: false,
                                  nb_photos: 1,
                                  first_name: docs_crossings[0].crossings[index_docs_crossings].user_name,
                                  age: 0,
                                  already_charmed: false,
                                  has_charmed_me: false,
                                  availability: {
                                      time_left: 100,
                                      availability_type: {
                                          color: '#FF4E00',
                                          duration: 10,
                                          label: 'label2',
                                          type: 'client'
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
                                          type: 'client'
                                  },
                                  profiles: [
                                  {
                                      id: docs_crossings[0].crossings[index_docs_crossings].user_id,
                                      mode: 0,
                                      url: docs_crossings[0].crossings[index_docs_crossings].facebook_picture,
                                      width: 50,
                                      height: 50
                                  }]
                              }
                          };

                        result.data.push(item_crossings); 
                    }
                }

                return res.json(result);                    
        });
    }        
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

//get all conversations
app.get('/api/users/:user_id/conversations', function (req, res) {
  /*var result =  {
           success: true,
           data: [{
              id: 100,              
              modification_date: '2017-07-22',
              is_read: false,
              creation_date: '2017-07-20',
              last_message: {
                  creation_date: '2017-07-21',
                  message: 'This is a new last message',
                  sender: {
                      id: 1023, 
                      type: 'type1',
                      first_name: 'Ana Paula',
                      gender: 'F'
                  }
              },
              real_participants: [{
                  id: 1520675761317155, 
                  type: 'type1',
                  first_name: 'Marcelo One',
                  gender: 'F'
              }],
              participants: [{                  
                  id: 1520675761317155,
                  user: {
                      id: 1520675761317155, 
                      type: 'type1',
                      first_name: 'Marcelo',
                      is_moderator: false,
                      profiles: [{
                          id: 102,
                          mode: 0,
                          url: 'https://scontent.xx.fbcdn.net/v/t1.0-1/p50x50/1391900_611843712200369_894384950_n.jpg?oh=8c1eda274a3bb3de0a56205510babf32&oe=5A803B39',
                          width: 50,
                          height: 50
                      }]
                  }
              },
              {                  
                  id: 103624497059053,
                  user: {
                      id: 103624497059053, 
                      type: 'type1',
                      first_name: 'Kandida',
                      is_moderator: false,
                      profiles: [{
                          id: 102,
                          mode: 0,
                          url: 'https://scontent.xx.fbcdn.net/v/t1.0-1/p50x50/22046610_103948640359972_1642469792614532733_n.jpg?oh=f17116c029f1086f1256f80bebd561f9&oe=5A4EA824',
                          width: 50,
                          height: 50
                      }]
                  }
              }]              
          }]
    };
    
    var result =  {
           success: true,
           data: [{
              id: 100,                            
              is_read: false,
              creation_date: '2017-07-20',              
              participants: [{                  
                  id: 1520675761317155,
                  user: {
                      id: 1520675761317155, 
                      type: 'client',
                      first_name: 'Marcelo',                      
                      profiles: [{
                          id: 102,
                          mode: 0,
                          url: 'https://scontent.xx.fbcdn.net/v/t1.0-1/p50x50/1391900_611843712200369_894384950_n.jpg?oh=8c1eda274a3bb3de0a56205510babf32&oe=5A803B39',
                          width: 50,
                          height: 50
                      }]
                  }
              },
              {                  
                  id: 103624497059053,
                  user: {
                      id: 103624497059053, 
                      type: 'client',
                      first_name: 'Kandida',
                      profiles: [{
                          id: 102,
                          mode: 0,
                          url: 'https://scontent.xx.fbcdn.net/v/t1.0-1/p50x50/22046610_103948640359972_1642469792614532733_n.jpg?oh=f17116c029f1086f1256f80bebd561f9&oe=5A4EA824',
                          width: 50,
                          height: 50
                      }]
                  }
              }]              
          }]
    };
    
    console.log("query param: " + req.query.participants);*/
        
    if(!req.params.user_id) {
        res.status(400).send('400 Bad Request')
    }

    if (!db) {
        initDb(function(err){});
    }

    if (db) {
        
        var result = {
              success: true,
              data: []
        };
        
        if(!req.query.participants || req.query.participants == undefined) {
            
            /*            
            db.collection('conversations').find({participants: {$elemMatch: {user_id:parseInt(req.params.user_id)}}}).toArray(function (err, result_find_1) {                
                console.log("result_find_1_id: " + result_find_1[0]._id);
                console.log("result_find_1_id: " + result_find_1[0].participants);
                console.log("result_find_1_length: " + result_find_1.length);
                console.log("result_find_1: " + JSON.stringify(result_find_1[0]));
            } );
            
            db.collection('conversations').find({participants: {user_id:parseInt(req.query.user_id)}}).toArray(function (err, result_find_2) {                
                console.log("result_find_2_id: " + result_find_2[0]._id);
                console.log("result_find_2_id: " + result_find_2[0].participants);
                console.log("result_find_2_length: " + result_find_2.length);
                console.log("result_find_2: " + JSON.stringify(result_find_2[0]));
            } );
            
            */

            //get all user_id conversations
            db.collection('conversations').aggregate([
                {$unwind:'$participants'}, 
                {$lookup: {from: 'users', localField:'participants.user_id', foreignField:'user_id', as:'participantsObjects'}}, 
                {$unwind: '$participantsObjects'}, 
                {$group: {_id:'$_id', participants: {'$push':'$participantsObjects'} }},
                {$match: {$or: [{'participants.user_id':parseInt(req.params.user_id)}]} }]).toArray(function (err, docs_conversations) {
                                   
                    console.log("docs_conversations: " + docs_conversations);

                    if (docs_conversations.length > 0) {

                        for (var index_docs_conversations = 0, len_docs_conversations = docs_conversations.length; index_docs_conversations < len_docs_conversations; index_docs_conversations++) {

                            var item_conversation_all = {
                                id: docs_conversations[index_docs_conversations]._id,                            
                                is_read: false,
                                creation_date: docs_conversations[index_docs_conversations].creation_date,              
                                participants: [
                                    {                  
                                        id: docs_conversations[index_docs_conversations].participants[0].user_id,
                                            user: {
                                            id: docs_conversations[index_docs_conversations].participants[0].user_id, 
                                            type: 'client',
                                            first_name: docs_conversations[index_docs_conversations].participants[0].user_name,
                                            profiles: [{
                                                  id: docs_conversations[index_docs_conversations].participants[0].user_id,
                                                  mode: 0,
                                                  url: docs_conversations[index_docs_conversations].participants[0].facebook_picture,
                                                  width: 50,
                                                  height: 50
                                            }]
                                        }
                                   },
                                   {                  
                                        id: docs_conversations[index_docs_conversations].participants[1].user_id,
                                            user: {
                                            id: docs_conversations[index_docs_conversations].participants[1].user_id, 
                                            type: 'client',
                                            first_name: docs_conversations[index_docs_conversations].participants[1].user_name,
                                            profiles: [{
                                                  id: docs_conversations[index_docs_conversations].participants[1].user_id,
                                                  mode: 0,
                                                  url: docs_conversations[index_docs_conversations].participants[1].facebook_picture,
                                                  width: 50,
                                                  height: 50
                                            }]
                                        }
                                   }
                                ]
                            };

                            result.data.push(item_conversation_all); 
                        }
                    }

                    return res.json(result);                    
            });
            
        } else {
            
            var recipient = req.query.participants.split(",");
            var conversation_was_inserted = false;
            
            console.log("recipient enviado: " + recipient[1]);
            
            //get conversation by recipient
            //get all user_id conversations
            db.collection('conversations').aggregate([
                {$unwind:'$participants'}, 
                {$lookup: {from: 'users', localField:'participants.user_id', foreignField:'user_id', as:'participantsObjects'}}, 
                {$unwind: '$participantsObjects'}, 
                {$group: {_id:'$_id', participants: {'$push':'$participantsObjects'} }},
                {$match: {$and: [{'participants.user_id':parseInt(req.params.user_id)}, {'participants.user_id':parseInt(recipient[1])}]} }]).toArray(function (err, docs_conversations_recipient) {
                
                    console.log("docs_conversations_recipient: " + docs_conversations_recipient.length);

                    if (docs_conversations_recipient.length > 0) {

                        for (var index_docs_conversations_recipient = 0, len_docs_conversations_recipient = docs_conversations_recipient.length; index_docs_conversations_recipient < len_docs_conversations_recipient; index_docs_conversations_recipient++) {

                            var item_conversation_recipient = {
                                id: docs_conversations_recipient[index_docs_conversations_recipient]._id,                            
                                is_read: false,
                                creation_date: docs_conversations_recipient[index_docs_conversations_recipient].creation_date,              
                                participants: [
                                    {                  
                                        id: docs_conversations_recipient[index_docs_conversations_recipient].participants[0].user_id,
                                            user: {
                                            id: docs_conversations_recipient[index_docs_conversations_recipient].participants[0].user_id, 
                                            type: 'client',
                                            first_name: docs_conversations_recipient[index_docs_conversations_recipient].participants[0].user_name,
                                            profiles: [{
                                                  id: docs_conversations_recipient[index_docs_conversations_recipient].participants[0].user_id,
                                                  mode: 0,
                                                  url: docs_conversations_recipient[index_docs_conversations_recipient].participants[0].facebook_picture,
                                                  width: 50,
                                                  height: 50
                                            }]
                                        }
                                   },
                                   {                  
                                        id: docs_conversations_recipient[index_docs_conversations_recipient].participants[1].user_id,
                                            user: {
                                            id: docs_conversations_recipient[index_docs_conversations_recipient].participants[1].user_id, 
                                            type: 'client',
                                            first_name: docs_conversations_recipient[index_docs_conversations_recipient].participants[1].user_name,
                                            profiles: [{
                                                  id: docs_conversations_recipient[index_docs_conversations_recipient].participants[1].user_id,
                                                  mode: 0,
                                                  url: docs_conversations_recipient[index_docs_conversations_recipient].participants[1].facebook_picture,
                                                  width: 50,
                                                  height: 50
                                            }]
                                        }
                                   }
                                ]
                            };

                            result.data.push(item_conversation_recipient);
                        }
                        
                        return res.json(result);
                    }
                    else {                        
                        var date = new Date();
                        date.setHours(date.getHours() - 3);
                        var creation_date_format = date.toISOString().split('T')[0];

                        db.collection('conversations').insert({
                            creation_date: creation_date_format, 
                            participants: [
                                {user_id: parseInt(req.params.user_id)}, 
                                {user_id: parseInt(recipient[1])}
                            ]
                        });
                        
                        //get conversation recipient inserted
                        db.collection('conversations').aggregate([
                            {$unwind:'$participants'}, 
                            {$lookup: {from: 'users', localField:'participants.user_id', foreignField:'user_id', as:'participantsObjects'}}, 
                            {$unwind: '$participantsObjects'}, 
                            {$group: {_id:'$_id', participants: {'$push':'$participantsObjects'} }},
                            {$match: {$and: [{'participants.user_id':parseInt(req.params.user_id)}, {'participants.user_id':parseInt(recipient[1])}]} }]).toArray(function (err, docs_conversations_inserted) {

                                console.log("docs_conversations_inserted: " + docs_conversations_inserted.length);

                                if (docs_conversations_inserted.length > 0) {

                                    for (var index_docs_conversations_inserted = 0, len_docs_conversations_inserted = docs_conversations_inserted.length; index_docs_conversations_inserted < len_docs_conversations_inserted; index_docs_conversations_inserted++) {

                                        var item_conversation_inserted = {
                                            id: docs_conversations_inserted[index_docs_conversations_inserted]._id,                            
                                            is_read: false,
                                            creation_date: docs_conversations_inserted[index_docs_conversations_inserted].creation_date,              
                                            participants: [
                                                {                  
                                                    id: docs_conversations_inserted[index_docs_conversations_inserted].participants[0].user_id,
                                                        user: {
                                                        id: docs_conversations_inserted[index_docs_conversations_inserted].participants[0].user_id, 
                                                        type: 'client',
                                                        first_name: docs_conversations_inserted[index_docs_conversations_inserted].participants[0].user_name,
                                                        profiles: [{
                                                              id: docs_conversations_inserted[index_docs_conversations_inserted].participants[0].user_id,
                                                              mode: 0,
                                                              url: docs_conversations_inserted[index_docs_conversations_inserted].participants[0].facebook_picture,
                                                              width: 50,
                                                              height: 50
                                                        }]
                                                    }
                                               },
                                               {                  
                                                    id: docs_conversations_inserted[index_docs_conversations_inserted].participants[1].user_id,
                                                        user: {
                                                        id: docs_conversations_inserted[index_docs_conversations_inserted].participants[1].user_id, 
                                                        type: 'client',
                                                        first_name: docs_conversations_inserted[index_docs_conversations_inserted].participants[1].user_name,
                                                        profiles: [{
                                                              id: docs_conversations_inserted[index_docs_conversations_inserted].participants[1].user_id,
                                                              mode: 0,
                                                              url: docs_conversations_inserted[index_docs_conversations_inserted].participants[1].facebook_picture,
                                                              width: 50,
                                                              height: 50
                                                        }]
                                                    }
                                               }
                                            ]
                                        };

                                        result.data.push(item_conversation_inserted);
                                    }
                                    
                                    return res.json(result);
                                    
                                }
                        });                    
                    }
            });
        }
    }     
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
      //var col = db.collection('positions');
      //col.insert({position: req.body.name, date: Date.now()});
      //var point = {"type" : "Point", "coordinates" : [req.body.lat, req.body.lon]};
      var date = new Date();
      date.setHours(date.getHours() - 3);
      var timestampISODate = new Date(date.toISOString());

      //get near positions by user  
      db.collection('positions').aggregate([
          {$geoNear: 
            { near: 
              {
                  type:'Point', 
                  coordinates:[parseFloat(req.body.latitude), parseFloat(req.body.longitude)] }, 
                  maxDistance:0.80*1609, 
                  spherical:true, 
                  distanceField:'distance', 
                  distanceMultiplier:0.000621371 
            } 
          }, 
          {$project:
            {
                'user_id':'$user_id',
                'time_by_day':{$floor:{$divide:[{$subtract:['$timestamp', new Date()]},24*60*60*1000 ]} },
                'date':'$timestamp' }
            }, 
          {$match: {time_by_day:-1, user_id:{$ne:parseInt(req.params.user_id)}} }, 
          {$group: {_id:null, crossings:{$addToSet:'$user_id'} } }
      ]).toArray(function (err, docs_positions) {

            if (docs_positions.length > 0) {
                
                console.log("-----> docs_positions.length: " + docs_positions.length);
                console.log("-----> docs_positions[0]: " + docs_positions[0]);
                //console.log("-----> docs_positions.crossings: " + docs_positions.crossings);
                //console.log("-----> docs_positions.crossings.length: " + docs_positions[0].crossings.length);
                
                db.collection('crossings').insert({
                    user_id:parseInt(req.params.user_id),
                    timestamp:timestampISODate,
                    crossings: docs_positions[0].crossings
                });
            }

            db.collection('positions').insert({
                user_id:parseInt(req.params.user_id),
                timestamp:timestampISODate,
                location: {
                    type : 'Point', 
                    coordinates : [parseFloat(req.body.latitude), parseFloat(req.body.longitude)]
                }
            });

            res.end();
      });      
    }
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
    
    var query = {
        user_id: req.params.user_id
    };

    db.collection('devices').find(query).toArray(function (err, docs) {
        
        var result = {
              success: true,
              data: []
        };

        //console.log(req.params.user_id + " docs: " + docs.length);
        
        if (docs.length <= 0) {
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
                        firebase_token : req.body.token,
                        type : req.body.type
                    }
                });    
            //}
        
            var result =  {
                 success: true,
                 data: {
                     id: req.params.user_id + '_' + req.body.android_id
                 }
            };

            return res.json(result);        
        }
    });
  }
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
      
    var query = {
        user_id: req.params.user_id
    };

    db.collection('devices').find(query).toArray(function (err, docs) {
        
        var result = {
              success: true,
              data: []
        };

        //console.log(req.params.user_id + " docs: " + docs.length);
        
        if (docs.length <= 0) {
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
                        firebase_token : req.body.token,
                        type : req.body.type
                    }
                });    
            //}
        
            var result =  {
                 success: true,
                 data: {
                     id: req.params.device_id
                 }
            };

            return res.json(result);        
        }
    });
      
  }
      
    /*var col = db.collection('devices');
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
        
    res.json(result);*/
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
