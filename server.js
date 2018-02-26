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
    bodyParser = require('body-parser'),
    path = require('path'),
    nodemailer = require('nodemailer'),
    cookieParser = require('cookie-parser');
    
Object.assign=require('object-assign');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'));

var db = null,
    dbDetails = new Object();
var routes = require('./routes/index');
var user = require('./routes/user');
var payment = require('./routes/payment');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req,res,next){
    req.db = db;
    next();
});

app.use('/', routes);
app.use('/user', user);
app.use('/payment', payment);

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

//var db = null,
//    dbDetails = new Object();

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

/////////////////////////////////////////
/*app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: err
    });
});

app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});*/
/////////////////////////////////////////

//firebase FCM
//var API_KEY = "AIzaSyDZyILex2S1s6UpHyHG6d7HYON7hxOQ4g0"; // Your Firebase Cloud Messaging Server API key
//var API_KEY = "AIzaSyDHJpFKv3FMrfHjuCTblYHiNjnAI7Jtl2Q"; // Your Firebase Cloud Messaging Server API key

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

app.put('/api/:user_id/payment/service/email/preferences', function (req, res) {
  if(!req.body.service_email_preferences) {
     res.status(400).send('400 Bad Request')
  }
  
  sendmail(req.body.service_email_preferences.email, 
	   req.body.service_email_preferences.subject + ' -- 1', 
	   req.body.service_email_preferences.text, 
	   req.body.service_email_preferences.html);
	
	sendmail2(req.body.service_email_preferences.email, 
	   req.body.service_email_preferences.subject + ' -- 2', 
	   req.body.service_email_preferences.text, 
	   req.body.service_email_preferences.html);
	
	sendmail3(req.body.service_email_preferences.email, 
	   req.body.service_email_preferences.subject + ' -- 3', 
	   req.body.service_email_preferences.text, 
	   req.body.service_email_preferences.html);
	
	sendmail4(req.body.service_email_preferences.email, 
	   req.body.service_email_preferences.subject + ' -- 4', 
	   req.body.service_email_preferences.text, 
	   req.body.service_email_preferences.html);
	
  var result = {
        success: true,
        data: {               
            id: req.params.user_id, 	
            service_email_preferences: req.body.service_email_preferences
        }
    };        
    
    res.json(result);
	
});

function sendmail(email, subject, text, html){
	
	var smtpTrans = nodemailer.createTransport({    
	    service: 'Godaddy',
	    host: "smtpout.secureserver.net",  
	    auth: {
		user: "contato@taskhunterapp.com",
		pass: "Contato#2018"
	    }
	});

     var mailOptions = {
	  from: 'Task Hunter App <contato@taskhunterapp.com>',
	  to: email,
	  subject: subject,
	  text: text,
	  html: html
	};

     smtpTrans.sendMail(mailOptions, function(error, info){
	  if (error) {
		console.log(error);
	  } else {
		console.log('Email sent: ' + info.response);
	  }
     });
}

function sendmail2(email, subject, text, html){
	
	var smtpTrans = nodemailer.createTransport({    
	    service: 'Godaddy',
	    host: "smtpout.secureserver.net",  
	    port: 465,
	    auth: {
		user: "contato@taskhunterapp.com",
		pass: "Contato#2018"
	    }
	});

     var mailOptions = {
	  from: 'Task Hunter App <contato@taskhunterapp.com>',
	  to: email,
	  subject: subject,
	  text: text,
	  html: html
	};

     smtpTrans.sendMail(mailOptions, function(error, info){
	  if (error) {
		console.log(error);
	  } else {
		console.log('Email sent: ' + info.response);
	  }
     });
}

function sendmail3(email, subject, text, html){
	
	var smtpTrans = nodemailer.createTransport({    
	    service: 'Godaddy',
	    host: "smtpout.secureserver.net",
	    port: 3535,
	    auth: {
		user: "contato@taskhunterapp.com",
		pass: "Contato#2018"
	    }
	});

     var mailOptions = {
	  from: 'Task Hunter App <contato@taskhunterapp.com>',
	  to: email,
	  subject: subject,
	  text: text,
	  html: html
	};

     smtpTrans.sendMail(mailOptions, function(error, info){
	  if (error) {
		console.log(error);
	  } else {
		console.log('Email sent: ' + info.response);
	  }
     });
}

function sendmail4(email, subject, text, html){
	
	var smtpTrans = nodemailer.createTransport({    
	    service: 'Godaddy',
	    host: "smtpout.secureserver.net",  
	    secureConnection: true,
	    port: 465,
	    auth: {
		user: "contato@taskhunterapp.com",
		pass: "Contato#2018"
	    }
	});

     var mailOptions = {
	  from: 'Task Hunter App <contato@taskhunterapp.com>',
	  to: email,
	  subject: subject,
	  text: text,
	  html: html
	};

     smtpTrans.sendMail(mailOptions, function(error, info){
	  if (error) {
		console.log(error);
	  } else {
		console.log('Email sent: ' + info.response);
	  }
     });
}

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
 
    const user_field_set = 'id,name,first_name,gender,birthday,email,location,picture.type(large)';

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
			
		    var register_date = new Date();
		    register_date.setHours(register_date.getHours() - 3);
		    var registerDateFormat = register_date.toISOString().split('T')[0];
		    var birthDateFormat = null;
		    if(facebook_json.birthday != undefined)
		    	birthDateFormat = facebook_json.birthday.split('/')[2] + '-' + facebook_json.birthday.split('/')[1] + '-' + facebook_json.birthday.split('/')[0];
		    //var registerDateFormat = register_date.getDate() + '/' + (register_date.getMonth() + 1) + '/' + register_date.getFullYear();

                    var jwt_access_token = jwt.sign(tokenData, 'fb106701ca07d55d53e66648b2cc2d4a');
                    
                    col.insert({
                           user_id: parseInt(facebook_json.id),
                           user_name: facebook_json.first_name, 
                           full_user_name: facebook_json.name,
                           gender: facebook_json.gender, 
                           email: facebook_json.email,
                           location: facebook_json.location,
                           access_token: jwt_access_token,
			   card_customer_name: '',
			   card_brand: '',
                           card_number: '',
                           card_code: '',
                           card_year: '',
                           card_month: '',
                           account: '',
                           agency: '',
                           digit: '',
                           bank: '',
			   address_complement: '',
			   city: facebook_json.location != undefined ? facebook_json.location.name : '',
			   country: 'BRA',
			   neighborhood: '',
			   register_date: registerDateFormat,
			   birth_date: birthDateFormat,
			   cpf: '',
			   cell_phone: '',
			   fixed_phone: '',
			   state: '',
			   street_address: '',
			   street_number: '',
			   zip_code: '',
                           facebook_access_token: req.body.assertion,
                           facebook_picture: facebook_json.picture.data.url,
                           matching_preferences: { age_max: 30, age_min: 20, female:1, male: 0 },
                           notification_settings: { charms: 0, match: 0, messages:0 },
                           service_matching_preferences: { services: [] },
                           service_working_preferences: { services: [] },
                           service_payment_preferences: { payments: [] },
                           service_feedback_preferences: { feedbacks: [] },
			   service_timeline_preferences: { matching: [], working: [] }
                    });
                    
                    var result = {        
                        access_token: jwt_access_token,
                        expires_in: 86400,        
                        scope: 'achievement_type_read countries_read language_read locale_read pack_read subscription_type_read report_type_read user_mode_read notification_type_read search_user all_user_read all_image_read user_device_create user_device_read user_device_update user_device_delete user_position_read user_position_update user_notifications_read user_poke_create user_message_create user_message_read user_message_update user_message_delete user_image_create user_image_read user_image_update user_image_delete user_conversation_create user_conversation_read user_conversation_update user_conversation_delete user_order_create user_order_read user_order_update user_applications_read user_applications_update user_applications_delete user_blocked_read user_blocked_create user_blocked_delete user_accepted_read user_accepted_create user_accepted_delete user_rejected_read user_rejected_create user_rejected_delete user_subscription_create user_subscription_read user_subscription_update user_subscription_delete user_achievement_create user_achievement_read user_achievement_update user_achievement_delete user_availability_create user_availability_read user_availability_update user_availability_delete user_social_create user_social_read user_social_update user_social_delete user_update user_delete user_read user_report_read user_report_create user_report_update user_report_delete',            
                        user_id: parseInt(facebook_json.id),
                        is_new: false,
                        refresh_token: '43p0v5m203kd9333goafve2qe9idqp0707'
                    };
			
		    sendmail(facebook_json.email, facebook_json.first_name + ', Bem-vindo ao Task Hunter App', 'Task Hunter App', '<h1>Seja bem-vindo!</h1><p>Para utilizar o Task Hunter App, basta selecionar os serviços de seu interesse no menu do aplicativo. Lembre-se de habilitar sua localização em seu smartphone.</p></br></br><p>Pronto! Agora é so andar por aí para cruzar com outros usuários (clientes ou profissinais) no mundo real com interesses em serviços semelhantes aos que você procura. Todas as pessoas com quem você cruzou aparecerão em sua Timeline automaticamente.</p>');
                    
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
    
    var query = {
        user_id: parseInt(req.params.user_id)
    };
    
    /*
    var result = {
          data: {
              id: req.params.user_id,
              age: 0,        
              first_name: user_docs[0].user_name,
              gender: user_docs[0].gender,
              register_date: '2010-07-16',
              birth_date: '1980-07-16',
              matching_preferences: { age_max: 30, age_min: 20, female:1, male: 0 },
              notification_settings: { charms: 0, match: 0, messages:0 },
              service_matching_preferences: user_docs[0].service_matching_preferences,
              service_working_preferences: user_docs[0].service_working_preferences,
              stats: { nb_invites: 0, nb_charms: 0, nb_crushes: 0 },
              job: 'Engenheiro Civil',
              nb_photos: 0,
              credits: 0,
              unread_conversations: 0,
              unread_notifications: 0
          }        
    };
    */

    db.collection('users').find(query).toArray(function (err, user_docs) {
    
        if (user_docs.length > 0) {
            var result = {
		  success: true,
                  data: {
                      id: req.params.user_id,
                      age: 0,        
                      first_name: user_docs[0].user_name,
		      full_name: user_docs[0].full_user_name,
                      gender: user_docs[0].gender,
                      register_date: user_docs[0].register_date,
                      email: user_docs[0].email,
		      card_customer_name: user_docs[0].card_customer_name,
		      card_brand: user_docs[0].card_brand,
                      card_number: user_docs[0].card_number,
                      card_code: user_docs[0].card_code,
                      card_year: user_docs[0].card_year,
                      card_month: user_docs[0].card_month,
                      account: user_docs[0].account,
                      agency: user_docs[0].agency,
                      digit: user_docs[0].digit,
                      bank: user_docs[0].bank,
		      address_complement: user_docs[0].address_complement,
		      city: user_docs[0].city,
		      country: user_docs[0].country,
		      neighborhood: user_docs[0].neighborhood,
		      birth_date: user_docs[0].birth_date,
		      cpf: user_docs[0].cpf,
		      cell_phone: user_docs[0].cell_phone,
		      fixed_phone: user_docs[0].fixed_phone,
		      state: user_docs[0].state,
		      street_address: user_docs[0].street_address,
		      street_number: user_docs[0].street_number,
		      zip_code: user_docs[0].zip_code,
                      matching_preferences: { age_max: 30, age_min: 20, female:1, male: 0 },
                      notification_settings: { charms: 0, match: 0, messages:0 },
                      service_matching_preferences: user_docs[0].service_matching_preferences,                      
                      service_working_preferences: user_docs[0].service_working_preferences,
                      service_payment_preferences: user_docs[0].service_payment_preferences,                      
                      service_feedback_preferences: user_docs[0].service_feedback_preferences,
		      service_timeline_preferences: user_docs[0].service_timeline_preferences,
                      stats: { nb_invites: 0, nb_charms: 0, nb_crushes: 0 },
		      referral: {
		          texts: { 
			      sponsor_share_text_mail: '{LINK}', 
			      sponsor_share_text_texto: '{LINK}' },
			  sponsor_link: { 
		              code: 0, 
			      id: req.params.user_id,
			      destination: 'Olá, conheça o Task Hunter. Encontre pessoas que cruzaram seu caminho com 1 click. Saiba mais e instale em www.taskhunter.com' }
		      },
                      nb_photos: 0,
                      credits: 0,
                      unread_conversations: 0,
                      unread_notifications: 0
                  }        
            };
            
            //get all payments by user
            db.collection('payment_preferences').aggregate([
                {$match: 
		   {$or: [{matching:parseInt(req.params.user_id)}, {working:parseInt(req.params.user_id)}], 
		      $and: [{paid:false}, {abandoned:false}] } }]).toArray(function (err, docs_payments) {
                                   
                    //console.log("docs_payments: " + docs_payments);

                    if (docs_payments.length > 0) {

                        for (var index_docs_payments = 0, len_docs_payments = docs_payments.length; index_docs_payments < len_docs_payments; index_docs_payments++) {

                            var item_payment = {
				id: docs_payments[index_docs_payments]._id.toHexString(),
                                matching: docs_payments[index_docs_payments].matching,
                                working: docs_payments[index_docs_payments].working,
                                type: docs_payments[index_docs_payments].type,
                                name: docs_payments[index_docs_payments].name,
                                price: docs_payments[index_docs_payments].price,
				date: docs_payments[index_docs_payments].date,
				time: docs_payments[index_docs_payments].time,
                                card: docs_payments[index_docs_payments].card,
                                condition: docs_payments[index_docs_payments].condition,
                                tax: docs_payments[index_docs_payments].tax,
                                paid: docs_payments[index_docs_payments].paid,
				transfered: docs_payments[index_docs_payments].transfered,
				abandoned: docs_payments[index_docs_payments].abandoned
                            };

                            result.data.service_payment_preferences.payments.push(item_payment); 
                        }
                    }
		    
		    //get all feedbacks by user
		    db.collection('feedback_preferences').aggregate([
			{$match: {$or: [{matching:parseInt(req.params.user_id)}, {working:parseInt(req.params.user_id)}]} }]).toArray(function (err, docs_feedbacks) {

			    //console.log("docs_feedbacks: " + docs_feedbacks);

			    if (docs_feedbacks.length > 0) {

				for (var index_docs_feedbacks = 0, len_docs_feedbacks = docs_feedbacks.length; index_docs_feedbacks < len_docs_feedbacks; index_docs_feedbacks++) {

				    var item_feedback = {
					matching: docs_feedbacks[index_docs_feedbacks].matching,
					id: docs_feedbacks[index_docs_feedbacks]._id.toHexString(),
					payment: docs_feedbacks[index_docs_feedbacks].payment,
					working: docs_feedbacks[index_docs_feedbacks].working,
					working_name: docs_feedbacks[index_docs_feedbacks].working_name,
					type: docs_feedbacks[index_docs_feedbacks].type,
					name: docs_feedbacks[index_docs_feedbacks].name,
					evaluation: docs_feedbacks[index_docs_feedbacks].evaluation
				    };

				    result.data.service_feedback_preferences.feedbacks.push(item_feedback); 
				}
			    }
			    			    
			    //get all timeline by user
			    db.collection('service_preferences').aggregate([
				{$match: {$or: [{user_id:parseInt(req.params.user_id)}] } }]).toArray(function (err, docs_timeline) {

				    //console.log("docs_timeline: " + docs_timeline);

				    if (docs_timeline.length > 0) {

					for (var index_docs_timeline = 0, len_docs_timeline = docs_timeline.length; index_docs_timeline < len_docs_timeline; index_docs_timeline++) {					    
					    //result.data.service_timeline_preferences.matching.push(docs_timeline[index_docs_timeline].matching.services);
					    if(docs_timeline[index_docs_timeline].matching != undefined)
					    	result.data.service_timeline_preferences.matching = docs_timeline[index_docs_timeline].matching.services;
					    if(docs_timeline[index_docs_timeline].working != undefined)
					    	result.data.service_timeline_preferences.working = docs_timeline[index_docs_timeline].working.services;
					}
				    }

				    return res.json(result);                    
			    });

			    //return res.json(result);                    
		    });
		    
                    //return res.json(result);                    
            });
            ////

            //return res.json(result); 
        }
    });
         
});

// update connected fields preferences
app.put('/api/users/:user_id', function (req, res) {
    
    /*if(!req.body.service_matching_preferences) {
        res.status(400).send('400 Bad Request')
    }*/  
    
    db.collection('users').update({ 
        user_id: parseInt(req.params.user_id) },
        { $set:
            {
		bank : req.body.bank,
		agency : req.body.agency,
		account : req.body.account,
		card_customer_name: req.body.card_customer_name,
		card_brand: req.body.card_brand,
                card_number: req.body.card_number,
                card_code: req.body.card_code,
                card_year: req.body.card_year,
                card_month: req.body.card_month,
		digit : req.body.digit,		    
		cpf : req.body.cpf,
		birth_date: req.body.birth_date,
		street_address : req.body.street_address,
		street_number : req.body.street_number,
		neighborhood : req.body.neighborhood,
		zip_code : req.body.zip_code,
		cell_phone : req.body.cell_phone
            }
        },
        { upsert : true }
    );
	
    var query = {
        user_id: parseInt(req.params.user_id)
    };
    
    db.collection('users').find(query).toArray(function (err, user_docs) {
    
        if (user_docs.length > 0) {
            var result = {
		  success: true,
                  data: {
                      id: req.params.user_id,
                      age: 0,        
                      first_name: user_docs[0].user_name,
		      full_name: user_docs[0].full_user_name,
                      gender: user_docs[0].gender,
                      register_date: user_docs[0].register_date,
                      email: user_docs[0].email,
		      card_customer_name: user_docs[0].card_customer_name,
		      card_brand: user_docs[0].card_brand,
                      card_number: user_docs[0].card_number,
                      card_code: user_docs[0].card_code,
                      card_year: user_docs[0].card_year,
                      card_month: user_docs[0].card_month,
                      account: user_docs[0].account,
                      agency: user_docs[0].agency,
                      digit: user_docs[0].digit,
                      bank: user_docs[0].bank,
		      address_complement: user_docs[0].address_complement,
		      city: user_docs[0].city,
		      country: user_docs[0].country,
		      neighborhood: user_docs[0].neighborhood,
		      birth_date: user_docs[0].birth_date,
		      cpf: user_docs[0].cpf,
		      cell_phone: user_docs[0].cell_phone,
		      fixed_phone: user_docs[0].fixed_phone,
		      state: user_docs[0].state,
		      street_address: user_docs[0].street_address,
		      street_number: user_docs[0].street_number,
		      zip_code: user_docs[0].zip_code,
                      matching_preferences: { age_max: 30, age_min: 20, female:1, male: 0 },
                      notification_settings: { charms: 0, match: 0, messages:0 },
                      service_matching_preferences: user_docs[0].service_matching_preferences,                      
                      service_working_preferences: user_docs[0].service_working_preferences,
                      service_payment_preferences: user_docs[0].service_payment_preferences,                      
                      service_feedback_preferences: user_docs[0].service_feedback_preferences,                      
                      stats: { nb_invites: 0, nb_charms: 0, nb_crushes: 0 },                      
                      nb_photos: 0,
                      credits: 0,
                      unread_conversations: 0,
                      unread_notifications: 0
                  }        
            };
			
	  return res.json(result);

	  }
    });
});

// update service matching preferences
app.put('/api/users/:user_id/service/matching/preferences', function (req, res) {
    
    if(!req.body.service_matching_preferences) {
        res.status(400).send('400 Bad Request')
    }
  
    //console.log('req.body.service_matching_preferences --> ' + req.body.service_matching_preferences);    
  
    var matched = req.body.service_matching_preferences.services.filter(o => o.enabled === true);
    //console.log(matched);        
    
    db.collection('users').update({ 
        user_id: parseInt(req.params.user_id) },
        { $set:
            {
              'service_matching_preferences.services' : matched 
            }
        },
        { upsert : true }
    );
    
    var result = {
        success: true,
        data: {               
            id: req.params.user_id, 	
            service_matching_preferences: req.body.service_matching_preferences
        }
    };        
    
    return res.json(result);  
});

// update service working preferences
app.put('/api/users/:user_id/service/working/preferences', function (req, res) {
    
  if(!req.body.service_working_preferences) {
        res.status(400).send('400 Bad Request')
    }
  
    //console.log('req.body.service_working_preferences --> ' + req.body.service_working_preferences);    
  
    var worked = req.body.service_working_preferences.services.filter(o => o.enabled === true);
    //console.log(worked);        
    
    db.collection('users').update({ 
        user_id: parseInt(req.params.user_id) },
        { $set:
            {
              'service_working_preferences.services' : worked 
            }
        },
        { upsert : true }
    );
    
    var result = {
        success: true,
        data: {               
            id: req.params.user_id, 	
            service_working_preferences: req.body.service_working_preferences
        }
    };
    
    return res.json(result);
});

// update service payment preferences
app.put('/api/users/:user_id/service/payment/preferences', function (req, res) {
    
    if(!req.body.service_payment_preferences) {
        res.status(400).send('400 Bad Request')
    }
    
    //console.log('req.body.service_payment_preferences --> ' + req.body.service_payment_preferences);
    
    var date = new Date();
    date.setHours(date.getHours() - 3);
    var timestampISODate = new Date(date.toISOString());
    
    //matching
    if(req.body.service_payment_preferences.payments.length > 0) {
        for (var i = 0, len = req.body.service_payment_preferences.payments.length; i < len; i++) {
		
	    var ObjectId = require('mongodb').ObjectID;
	    var paymentObjectId = ObjectId(req.body.service_payment_preferences.payments[i].id);
	    req.body.service_payment_preferences.payments[i].id = paymentObjectId.toHexString();
		
	    db.collection('payment_preferences').update({ 
		matching : parseInt(req.body.service_payment_preferences.payments[i].matching), 
		working : parseInt(req.body.service_payment_preferences.payments[i].working), 
		_id : paymentObjectId,
		type : req.body.service_payment_preferences.payments[i].type, 
		name : req.body.service_payment_preferences.payments[i].name
	    }, 
	    { $set: 
		{
		    card : req.body.service_payment_preferences.payments[i].card,
		    condition : req.body.service_payment_preferences.payments[i].condition,
		    date : req.body.service_payment_preferences.payments[i].date,
		    time : req.body.service_payment_preferences.payments[i].time,
		    price : req.body.service_payment_preferences.payments[i].price,
		    tax : req.body.service_payment_preferences.payments[i].tax,
		    paid : req.body.service_payment_preferences.payments[i].paid,
		    transfered : req.body.service_payment_preferences.payments[i].transfered,
		    abandoned : req.body.service_payment_preferences.payments[i].abandoned
		 }
	    },{upsert:true});
        }
    }
    
    var result = {
        success: true,
        data: {               
            id: req.params.user_id, 	
            service_payment_preferences: req.body.service_payment_preferences
        }
    };
    
    return res.json(result);  
});

// update service feedback preferences
app.put('/api/users/:user_id/service/feedback/preferences', function (req, res) {
    
    if(!req.body.service_feedback_preferences) {
        res.status(400).send('400 Bad Request')
    }
    
    //console.log('req.body.service_feedback_preferences --> ' + req.body.service_feedback_preferences);
    
    var date = new Date();
    date.setHours(date.getHours() - 3);
    var timestampISODate = new Date(date.toISOString());
    
    //matching
    if(req.body.service_feedback_preferences.feedbacks.length > 0) {
        for (var i = 0, len = req.body.service_feedback_preferences.feedbacks.length; i < len; i++) {
		
	    var ObjectId = require('mongodb').ObjectID;
	    var feedbackObjectId = ObjectId(req.body.service_feedback_preferences.feedbacks[i].id);
	    req.body.service_feedback_preferences.feedbacks[i].id = feedbackObjectId.toHexString();
		
            db.collection('feedback_preferences').update({ 
                matching : parseInt(req.body.service_feedback_preferences.feedbacks[i].matching), 
                working : parseInt(req.body.service_feedback_preferences.feedbacks[i].working), 
		working_name : req.body.service_feedback_preferences.feedbacks[i].working_name,
		_id : feedbackObjectId,
		payment: req.body.service_feedback_preferences.feedbacks[i].payment,
                type : req.body.service_feedback_preferences.feedbacks[i].type, 
                name : req.body.service_feedback_preferences.feedbacks[i].name
            }, 
            { $set: 
                {
                    evaluation : parseInt(req.body.service_feedback_preferences.feedbacks[i].evaluation),
                    date : timestampISODate
                 }
            },{upsert:true});
        }
    }
    
    var result = {
        success: true,
        data: {               
            id: req.params.user_id, 	
            service_feedback_preferences: req.body.service_feedback_preferences
        }
    };
    
    return res.json(result);  
});

// update service contact_us preferences
app.put('/api/users/:user_id/service/contact/us/preferences', function (req, res) {
      
    if(!req.body.service_contact_us_preferences) {
        res.status(400).send('400 Bad Request')
    }
    
    //console.log('req.body.service_feedback_preferences --> ' + req.body.service_feedback_preferences);
    
    var date = new Date();
    date.setHours(date.getHours() - 3);
    var timestampISODate = new Date(date.toISOString());
    
    db.collection('contact_us').insert({
    	user_id : parseInt(req.params.user_id),
    	timestamp : timestampISODate,
    	email : req.body.service_contact_us_preferences.email,
	subject : req.body.service_contact_us_preferences.subject,
	message : req.body.service_contact_us_preferences.message
    });
    
    var result = {
        success: true,
        data: {               
            id: req.params.user_id, 	
            service_contact_us_preferences: req.body.service_contact_us_preferences
        }
    };        
    
    return res.json(result);
});

// update service configuration preferences
app.put('/api/users/:user_id/service/configuration/preferences', function (req, res) {
    
  if(!req.body.service_configuration_preferences) {
        res.status(400).send('400 Bad Request')
    }
  
    //console.log('req.body.service_configuration_preferences --> ' + req.body.service_configuration_preferences);    
  
    db.collection('users').update({ 
        user_id: parseInt(req.params.user_id) },
        { $set:
            {
		card_customer_name: req.body.service_configuration_preferences.card_customer_name,
		card_brand: req.body.service_configuration_preferences.card_brand,
                card_number: req.body.service_configuration_preferences.card_number,
                card_code: req.body.service_configuration_preferences.card_code,
                card_year: req.body.service_configuration_preferences.card_year,
                card_month: req.body.service_configuration_preferences.card_month,
                account: req.body.service_configuration_preferences.account,
                agency: req.body.service_configuration_preferences.agency,
                digit: req.body.service_configuration_preferences.digit,
                bank: req.body.service_configuration_preferences.bank,
		address_complement: req.body.service_configuration_preferences.address_complement,
	        city: req.body.service_configuration_preferences.city,
	        country: req.body.service_configuration_preferences.country,
	        neighborhood: req.body.service_configuration_preferences.neighborhood,
	        birth_date: req.body.service_configuration_preferences.birth_date,
	        cpf: req.body.service_configuration_preferences.cpf,
	        cell_phone: req.body.service_configuration_preferences.cell_phone,
	        fixed_phone: req.body.service_configuration_preferences.fixed_phone,
	        state: req.body.service_configuration_preferences.state,
	        street_address: req.body.service_configuration_preferences.street_address,
	        street_number: req.body.service_configuration_preferences.street_number,
	        zip_code: req.body.service_configuration_preferences.zip_code
            }
        },
        { upsert : true }
    );
    
    var result = {
        success: true,
        data: {               
            id: req.params.user_id, 	
            service_configuration_preferences: req.body.service_configuration_preferences
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
    var timeFormat = date.toISOString().split('T')[1];
      
    col.insert({conversation_id: req.params.conversation_id, message: req.body.message, sender: parseInt(req.body.sender), recipient: parseInt(req.body.recipient), creation_date: dateFormat, creation_time: timeFormat});
      
    var query = {
        user_id: parseInt(req.body.recipient)
    };

    db.collection('devices').find(query).toArray(function (err, docs) {
        
        var firebase_token = "";

        for (var i = 0, len = docs.length; i < len; i++) {
            if (parseInt(docs[i].user_id) == parseInt(req.body.recipient)) {
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
		  creation_time: docs[i].creation_time,
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
	
  /*var result = {
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
                 
    return res.json(result);*/
    
    if(!req.params.user_id || !req.params.conversation_id) {
        res.status(400).send('400 Bad Request')
    }

    if (!db) {
        initDb(function(err){});
    }

    if (db) {
        
        var result = {
              success: true,
              data: {}
        };
	    
	var ObjectId = require('mongodb').ObjectID;
	var conversationObjectId = ObjectId(req.params.conversation_id);
	//console.log('conversationObjectId: ' + conversationObjectId);
	//console.log('conversationObjectId._id: ' + conversationObjectId._id);
	//console.log('conversationObjectId.toString(): ' + conversationObjectId.toString());

	//get conversation by id
	db.collection('conversations').aggregate([
		{$unwind:'$participants'}, 
		{$lookup: {from: 'users', localField:'participants.user_id', foreignField:'user_id', as:'participantsObjects'}}, 
		{$unwind: '$participantsObjects'}, 
		{$group: {_id:'$_id', participants: {'$push':'$participantsObjects'} }},
		{$match: {$and: [{'_id': conversationObjectId }]} }]).toArray(function (err, docs_conversations) {

		//console.log('docs_conversations.length: ' + docs_conversations.length);
		
		if (docs_conversations.length > 0) {
			
			//console.log('docs_conversations[0]: ' + docs_conversations[0]);

			for (var index_docs_conversations = 0, len_docs_conversations = docs_conversations.length; index_docs_conversations < len_docs_conversations; index_docs_conversations++) {

				var item_conversation = {
					id: docs_conversations[index_docs_conversations]._id,
					creation_date: docs_conversations[index_docs_conversations].creation_date,              
					real_participants: [
					   {                  	
						id: docs_conversations[index_docs_conversations].participants[0].user_id,									
						first_name: docs_conversations[index_docs_conversations].participants[0].user_name,
						profiles: [{
							  id: docs_conversations[index_docs_conversations].participants[0].user_id,
							  mode: 0,
							  url: docs_conversations[index_docs_conversations].participants[0].facebook_picture,
							  width: 50,
							  height: 50
						}]

					   },
					   {                  									

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
					]
				};

				result.data = item_conversation;
			}
		}

		return res.json(result);                    
	});
     }	
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
            "id": 1520675761317155,
            "notification_type": "471,524,525,526,529,530,531,565,791,792",
            "notifier": {
                "id": 1036244970590531,
                "type": "client",
                "is_accepted": true,
                "my_relation": 1,
                "gender": "female",
                "is_charmed": false,
                "nb_photos": 1,
                "first_name": "Cláudio",
                "age": 0,
                "service_matching_preferences": {
                    "services": [
                        {
                            "enabled": true,
                            "name": "chuveiro",
                            "type": "eletrica"
                        }
                    ]
                },
                "service_working_preferences": {
                    "services": [
                        {
                            "enabled": true,
                            "name": "grade",
                            "type": "pintura"
                        },
                        {
                            "enabled": true,
                            "name": "chuveiro",
                            "type": "eletrica"
                        },
                        {
                            "enabled": true,
                            "name": "banheiro",
                            "type": "hidraulica"
                        },
                        {
                            "enabled": true,
                            "name": "moveis",
                            "type": "marcenaria"
                        },
                        {
                            "enabled": true,
                            "name": "construcao",
                            "type": "pedreiro"
                        },
                        {
                            "enabled": true,
                            "name": "grade",
                            "type": "serralheiro"
                        },
                        {
                            "enabled": true,
                            "name": "instalacao",
                            "type": "ar_cond_split"
                        },
                        {
                            "enabled": true,
                            "name": "instalacao",
                            "type": "gas_central"
                        },
                        {
                            "enabled": true,
                            "name": "limpeza",
                            "type": "servicos_gerais"
                        },
                        {
                            "enabled": true,
                            "name": "geladeira",
                            "type": "eletro"
                        },
                        {
                            "enabled": true,
                            "name": "box_banheiro",
                            "type": "vidracaria"
                        }
                    ]
                },
                "service_feedback_preferences": {
                    "feedbacks": []
                },
                "service_timeline_preferences": {
                    "working": [
                        {
                            "user_id": 103624497059053,
                            "item": {
                                "enabled": true,
                                "name": "instalacao",
                                "type": "gas_central"
                            }
                        },
                        {
                            "user_id": 103624497059053,
                            "item": {
                                "enabled": true,
                                "name": "moveis",
                                "type": "marcenaria"
                            }
                        },
                        {
                            "user_id": 103624497059053,
                            "item": {
                                "enabled": true,
                                "name": "grade",
                                "type": "pintura"
                            }
                        },
                        {
                            "user_id": 103624497059053,
                            "item": {
                                "enabled": true,
                                "name": "chuveiro",
                                "type": "eletrica"
                            }
                        },
                        {
                            "user_id": 103624497059053,
                            "item": {
                                "enabled": true,
                                "name": "banheiro",
                                "type": "hidraulica"
                            }
                        },
                        {
                            "user_id": 103624497059053,
                            "item": {
                                "enabled": true,
                                "name": "construcao",
                                "type": "pedreiro"
                            }
                        },
                        {
                            "user_id": 103624497059053,
                            "item": {
                                "enabled": true,
                                "name": "grade",
                                "type": "serralheiro"
                            }
                        },
                        {
                            "user_id": 103624497059053,
                            "item": {
                                "enabled": true,
                                "name": "instalacao",
                                "type": "ar_cond_split"
                            }
                        },
                        {
                            "user_id": 103624497059053,
                            "item": {
                                "enabled": true,
                                "name": "limpeza",
                                "type": "servicos_gerais"
                            }
                        },
                        {
                            "user_id": 103624497059053,
                            "item": {
                                "enabled": true,
                                "name": "geladeira",
                                "type": "eletro"
                            }
                        },
                        {
                            "user_id": 103624497059053,
                            "item": {
                                "enabled": true,
                                "name": "box_banheiro",
                                "type": "vidracaria"
                            }
                        }
                    ],
                    "matching": [
                        {
                            "user_id": 103624497059053,
                            "item": {
                                "enabled": true,
                                "name": "chuveiro",
                                "type": "eletrica"
                            }
                        }
                    ]
                },
                "already_charmed": false,
                "has_charmed_me": false,
                "availability": {
                    "time_left": 100,
                    "availability_type": {
                        "color": "#FF4E00",
                        "duration": 10,
                        "label": "label2",
                        "type": "client"
                    }
                },
                "last_meet_position": {
                    "creation_date": "2017-08-15",
                    "lat": -30.061004,
                    "lon": -51.190147
                },
                "is_invited": false,
                "last_invite_received": {
                    "color": "#FF4E00",
                    "duration": 20,
                    "label": "label3",
                    "type": "client"
                },
                "profiles": [
                    {
                        "id": 103624497059053,
                        "mode": 0,
                        "url": "https://scontent.xx.fbcdn.net/v/t1.0-1/p200x200/22089386_105833976838105_2430462272889869880_n.jpg?oh=068ff1688f6d5952ac9ffc7060fe0d62&oe=5AEA348C",
                        "width": 50,
                        "height": 50
                    }
                ]
            }
        },
		 {
            "id": 1520675761317155,
            "notification_type": "471,524,525,526,529,530,531,565,791,792",
            "notifier": {
                "id": 1036244970590532,
                "type": "client",
                "is_accepted": true,
                "my_relation": 1,
                "gender": "female",
                "is_charmed": false,
                "nb_photos": 1,
                "first_name": "João",
                "age": 0,
                "service_matching_preferences": {
                    "services": [
                        {
                            "enabled": true,
                            "name": "chuveiro",
                            "type": "eletrica"
                        }
                    ]
                },
                "service_working_preferences": {
                    "services": [
                        
                        {
                            "enabled": true,
                            "name": "moveis",
                            "type": "marcenaria"
                        },
                        {
                            "enabled": true,
                            "name": "construcao",
                            "type": "pedreiro"
                        },
                        {
                            "enabled": true,
                            "name": "grade",
                            "type": "serralheiro"
                        },
                        {
                            "enabled": true,
                            "name": "instalacao",
                            "type": "ar_cond_split"
                        },
                        {
                            "enabled": true,
                            "name": "instalacao",
                            "type": "gas_central"
                        },
                        {
                            "enabled": true,
                            "name": "limpeza",
                            "type": "servicos_gerais"
                        },
                        {
                            "enabled": true,
                            "name": "geladeira",
                            "type": "eletro"
                        },
                        {
                            "enabled": true,
                            "name": "box_banheiro",
                            "type": "vidracaria"
                        }
                    ]
                },
                "service_feedback_preferences": {
                    "feedbacks": []
                },
                "service_timeline_preferences": {
                    "working": [
                        
                        {
                            "user_id": 103624497059053,
                            "item": {
                                "enabled": true,
                                "name": "banheiro",
                                "type": "hidraulica"
                            }
                        },
                        {
                            "user_id": 103624497059053,
                            "item": {
                                "enabled": true,
                                "name": "construcao",
                                "type": "pedreiro"
                            }
                        },
                        {
                            "user_id": 103624497059053,
                            "item": {
                                "enabled": true,
                                "name": "grade",
                                "type": "serralheiro"
                            }
                        },
                        {
                            "user_id": 103624497059053,
                            "item": {
                                "enabled": true,
                                "name": "instalacao",
                                "type": "ar_cond_split"
                            }
                        },
                        {
                            "user_id": 103624497059053,
                            "item": {
                                "enabled": true,
                                "name": "limpeza",
                                "type": "servicos_gerais"
                            }
                        },
                        {
                            "user_id": 103624497059053,
                            "item": {
                                "enabled": true,
                                "name": "geladeira",
                                "type": "eletro"
                            }
                        },
                        {
                            "user_id": 103624497059053,
                            "item": {
                                "enabled": true,
                                "name": "box_banheiro",
                                "type": "vidracaria"
                            }
                        }
                    ],
                    "matching": [
                        {
                            "user_id": 103624497059053,
                            "item": {
                                "enabled": true,
                                "name": "chuveiro",
                                "type": "eletrica"
                            }
                        }
                    ]
                },
                "already_charmed": false,
                "has_charmed_me": false,
                "availability": {
                    "time_left": 100,
                    "availability_type": {
                        "color": "#FF4E00",
                        "duration": 10,
                        "label": "label2",
                        "type": "client"
                    }
                },
                "last_meet_position": {
                    "creation_date": "2017-08-15",
                    "lat": -30.061004,
                    "lon": -51.190147
                },
                "is_invited": false,
                "last_invite_received": {
                    "color": "#FF4E00",
                    "duration": 20,
                    "label": "label3",
                    "type": "client"
                },
                "profiles": [
                    {
                        "id": 103624497059053,
                        "mode": 0,
                        "url": "https://scontent.xx.fbcdn.net/v/t1.0-1/p200x200/22089386_105833976838105_2430462272889869880_n.jpg?oh=068ff1688f6d5952ac9ffc7060fe0d62&oe=5AEA348C",
                        "width": 50,
                        "height": 50
                    }
                ]
            }
        },
		 {
            "id": 1520675761317155,
            "notification_type": "471,524,525,526,529,530,531,565,791,792",
            "notifier": {
                "id": 1036244970590533,
                "type": "client",
                "is_accepted": true,
                "my_relation": 1,
                "gender": "female",
                "is_charmed": false,
                "nb_photos": 1,
                "first_name": "Paulo",
                "age": 0,
                "service_matching_preferences": {
                    "services": [
                        {
                            "enabled": true,
                            "name": "chuveiro",
                            "type": "eletrica"
                        }
                    ]
                },
                "service_working_preferences": {
                    "services": [
                        {
                            "enabled": true,
                            "name": "grade",
                            "type": "pintura"
                        },
                        {
                            "enabled": true,
                            "name": "chuveiro",
                            "type": "eletrica"
                        },                        
                        {
                            "enabled": true,
                            "name": "limpeza",
                            "type": "servicos_gerais"
                        },
                        {
                            "enabled": true,
                            "name": "geladeira",
                            "type": "eletro"
                        },
                        {
                            "enabled": true,
                            "name": "box_banheiro",
                            "type": "vidracaria"
                        }
                    ]
                },
                "service_feedback_preferences": {
                    "feedbacks": []
                },
                "service_timeline_preferences": {
                    "working": [
                        {
                            "user_id": 103624497059053,
                            "item": {
                                "enabled": true,
                                "name": "instalacao",
                                "type": "gas_central"
                            }
                        },
                        
                        {
                            "user_id": 103624497059053,
                            "item": {
                                "enabled": true,
                                "name": "grade",
                                "type": "pintura"
                            }
                        },
                        {
                            "user_id": 103624497059053,
                            "item": {
                                "enabled": true,
                                "name": "chuveiro",
                                "type": "eletrica"
                            }
                        },
                        
                        {
                            "user_id": 103624497059053,
                            "item": {
                                "enabled": true,
                                "name": "grade",
                                "type": "serralheiro"
                            }
                        },
                       
                        {
                            "user_id": 103624497059053,
                            "item": {
                                "enabled": true,
                                "name": "limpeza",
                                "type": "servicos_gerais"
                            }
                        },
                        {
                            "user_id": 103624497059053,
                            "item": {
                                "enabled": true,
                                "name": "geladeira",
                                "type": "eletro"
                            }
                        },
                        {
                            "user_id": 103624497059053,
                            "item": {
                                "enabled": true,
                                "name": "box_banheiro",
                                "type": "vidracaria"
                            }
                        }
                    ],
                    "matching": [
                        {
                            "user_id": 103624497059053,
                            "item": {
                                "enabled": true,
                                "name": "chuveiro",
                                "type": "eletrica"
                            }
                        }
                    ]
                },
                "already_charmed": false,
                "has_charmed_me": false,
                "availability": {
                    "time_left": 100,
                    "availability_type": {
                        "color": "#FF4E00",
                        "duration": 10,
                        "label": "label2",
                        "type": "client"
                    }
                },
                "last_meet_position": {
                    "creation_date": "2017-08-15",
                    "lat": -30.061004,
                    "lon": -51.190147
                },
                "is_invited": false,
                "last_invite_received": {
                    "color": "#FF4E00",
                    "duration": 20,
                    "label": "label3",
                    "type": "client"
                },
                "profiles": [
                    {
                        "id": 103624497059053,
                        "mode": 0,
                        "url": "https://scontent.xx.fbcdn.net/v/t1.0-1/p200x200/22089386_105833976838105_2430462272889869880_n.jpg?oh=068ff1688f6d5952ac9ffc7060fe0d62&oe=5AEA348C",
                        "width": 50,
                        "height": 50
                    }
                ]
            }
        },
		 {
            "id": 1520675761317155,
            "notification_type": "471,524,525,526,529,530,531,565,791,792",
            "notifier": {
                "id": 1036244970590534,
                "type": "client",
                "is_accepted": true,
                "my_relation": 1,
                "gender": "female",
                "is_charmed": false,
                "nb_photos": 1,
                "first_name": "Luiza",
                "age": 0,
                "service_matching_preferences": {
                    "services": [
                        {
                            "enabled": true,
                            "name": "chuveiro",
                            "type": "eletrica"
                        }
                    ]
                },
                "service_working_preferences": {
                    "services": [
                        {
                            "enabled": true,
                            "name": "grade",
                            "type": "pintura"
                        },
                        
                        {
                            "enabled": true,
                            "name": "banheiro",
                            "type": "hidraulica"
                        },
                        {
                            "enabled": true,
                            "name": "moveis",
                            "type": "marcenaria"
                        },
                        
                        {
                            "enabled": true,
                            "name": "grade",
                            "type": "serralheiro"
                        },                        
                        {
                            "enabled": true,
                            "name": "instalacao",
                            "type": "gas_central"
                        },
                        
                        {
                            "enabled": true,
                            "name": "geladeira",
                            "type": "eletro"
                        },
                        {
                            "enabled": true,
                            "name": "box_banheiro",
                            "type": "vidracaria"
                        }
                    ]
                },
                "service_feedback_preferences": {
                    "feedbacks": []
                },
                "service_timeline_preferences": {
                    "working": [
                        
                        {
                            "user_id": 103624497059053,
                            "item": {
                                "enabled": true,
                                "name": "moveis",
                                "type": "marcenaria"
                            }
                        },
                        {
                            "user_id": 103624497059053,
                            "item": {
                                "enabled": true,
                                "name": "grade",
                                "type": "pintura"
                            }
                        },
                        {
                            "user_id": 103624497059053,
                            "item": {
                                "enabled": true,
                                "name": "chuveiro",
                                "type": "eletrica"
                            }
                        },
                        
                        {
                            "user_id": 103624497059053,
                            "item": {
                                "enabled": true,
                                "name": "grade",
                                "type": "serralheiro"
                            }
                        },
                        {
                            "user_id": 103624497059053,
                            "item": {
                                "enabled": true,
                                "name": "instalacao",
                                "type": "ar_cond_split"
                            }
                        },
                        
                        {
                            "user_id": 103624497059053,
                            "item": {
                                "enabled": true,
                                "name": "geladeira",
                                "type": "eletro"
                            }
                        },
                        {
                            "user_id": 103624497059053,
                            "item": {
                                "enabled": true,
                                "name": "box_banheiro",
                                "type": "vidracaria"
                            }
                        }
                    ],
                    "matching": [
                        {
                            "user_id": 103624497059053,
                            "item": {
                                "enabled": true,
                                "name": "chuveiro",
                                "type": "eletrica"
                            }
                        }
                    ]
                },
                "already_charmed": false,
                "has_charmed_me": false,
                "availability": {
                    "time_left": 100,
                    "availability_type": {
                        "color": "#FF4E00",
                        "duration": 10,
                        "label": "label2",
                        "type": "client"
                    }
                },
                "last_meet_position": {
                    "creation_date": "2017-08-15",
                    "lat": -30.061004,
                    "lon": -51.190147
                },
                "is_invited": false,
                "last_invite_received": {
                    "color": "#FF4E00",
                    "duration": 20,
                    "label": "label3",
                    "type": "client"
                },
                "profiles": [
                    {
                        "id": 103624497059053,
                        "mode": 0,
                        "url": "https://scontent.xx.fbcdn.net/v/t1.0-1/p200x200/22089386_105833976838105_2430462272889869880_n.jpg?oh=068ff1688f6d5952ac9ffc7060fe0d62&oe=5AEA348C",
                        "width": 50,
                        "height": 50
                    }
                ]
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
	    {$lookup:{from:'feedback_preferences', localField:'crossings', foreignField:'working', as:'feedbackObjects'} },
            {$unwind:'$crossingsObjects'}, 
	    {$group:{_id:'$_id', crossings: {'$push': {'crossing_user': '$crossingsObjects', 'crossing_feedback': '$feedbackObjects'} } } }, 
            {$match:{$and:[{'_id':parseInt(req.params.user_id)}]} }]).toArray(function (err, docs_crossings) {

                //console.log("docs_crossings.length: " + docs_crossings.length);

                if (docs_crossings.length > 0) {
                    
                    var query = {
                        user_id: parseInt(req.params.user_id)
                    };

                    db.collection('users').find(query).toArray(function (err, user_docs) {

                        if (user_docs.length > 0) {
                            
                            for (var index_docs_crossings = 0, len_docs_crossings = docs_crossings[0].crossings.length; index_docs_crossings < len_docs_crossings; index_docs_crossings++) {
                                                                
                                var timeline_matching_crossings = { services : [] };
                                var timeline_working_crossings = { services : [] };

                                //matching
                                for (var index_docs_users = 0, len_docs_users = user_docs[0].service_matching_preferences.services.length; index_docs_users < len_docs_users; index_docs_users++) {

                                    var worked = docs_crossings[0].crossings[index_docs_crossings].crossing_user.service_working_preferences.services.find(o => o.type == user_docs[0].service_matching_preferences.services[index_docs_users].type && o.name == user_docs[0].service_matching_preferences.services[index_docs_users].name);

                                    if(worked != undefined){                                       
                                        var worked_item = { user_id: parseInt(docs_crossings[0].crossings[index_docs_crossings].crossing_user.user_id), item: worked };
                                        timeline_matching_crossings.services.push(worked_item);
                                    }
                                    
                                }

                                //working
                                for (var index_docs_users = 0, len_docs_users = user_docs[0].service_working_preferences.services.length; index_docs_users < len_docs_users; index_docs_users++) {

                                    var matched = docs_crossings[0].crossings[index_docs_crossings].crossing_user.service_matching_preferences.services.find(o => o.type == user_docs[0].service_working_preferences.services[index_docs_users].type && o.name == user_docs[0].service_working_preferences.services[index_docs_users].name);

                                    if(matched != undefined){
                                        var matched_item = { user_id: parseInt(docs_crossings[0].crossings[index_docs_crossings].crossing_user.user_id), item: matched };
                                        timeline_working_crossings.services.push(matched_item);
                                    }

                                }
                                
                                //console.log('timeline_matching_crossings.services.length: '+timeline_matching_crossings.services.length);
                                //console.log('timeline_working_crossings.services.length: '+timeline_working_crossings.services.length);
                                
                                db.collection('service_preferences').update({ 
                                    user_id: parseInt(req.params.user_id)},                                    
                                        { $set: 
                                            { "matching": timeline_matching_crossings }
                                        },
                                    { upsert : true }
                                );
                                
                                db.collection('service_preferences').update({ 
                                    user_id: parseInt(req.params.user_id)},                                    
                                        { $set: 
                                            { "working": timeline_working_crossings }
                                        },
                                    { upsert : true }
                                );
				    
				//crossing user service preferences
				db.collection('service_preferences').update({ 
                                    user_id: parseInt(docs_crossings[0].crossings[index_docs_crossings].crossing_user.user_id)},                                    
                                        { $set: 
                                            { "working": timeline_matching_crossings }
                                        },
                                    { upsert : true }
                                );
                                
                                db.collection('service_preferences').update({ 
                                    user_id: parseInt(docs_crossings[0].crossings[index_docs_crossings].crossing_user.user_id)},
                                        { $set: 
                                            { "matching": timeline_working_crossings }
                                        },
                                    { upsert : true }
                                );
				    
				var item_timeline = {						
				    working: timeline_matching_crossings.services,                            
				    matching: timeline_working_crossings.services
				};
                                                                
                                if(timeline_matching_crossings.services.length > 0 || timeline_working_crossings.services.length > 0){
                                    				    					
                                    var item_crossings = {
                                        id: parseInt(req.params.user_id),
                                        //modification_date: docs_crossings[index_docs_crossings].timestamp.split('T')[0],
                                        notification_type: '471,524,525,526,529,530,531,565,791,792',
                                        notifier: { 
                                            id: parseInt(docs_crossings[0].crossings[index_docs_crossings].crossing_user.user_id),
                                            type: 'client',
                                            //job: 'Serviços Gerais',
                                            is_accepted: true,
                                            //workplace: '\nEletricista\nPintor\nEncanador\nTroca de Chuveiro\nColocação Basalto',
                                            my_relation: 1,
                                            //distance: 20.90,
                                            gender: docs_crossings[0].crossings[index_docs_crossings].crossing_user.gender,                                            
                                            is_charmed: false,
                                            nb_photos: 1,
                                            first_name: docs_crossings[0].crossings[index_docs_crossings].crossing_user.user_name,
                                            age: 0,
					    service_matching_preferences: docs_crossings[0].crossings[index_docs_crossings].crossing_user.service_matching_preferences,
                      			    service_working_preferences: docs_crossings[0].crossings[index_docs_crossings].crossing_user.service_working_preferences,
					    service_feedback_preferences: { feedbacks: [] },
					    service_timeline_preferences: item_timeline,
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
                                            last_meet_position: {},
                                            is_invited: false,
                                            last_invite_received: {
                                                color: '#FF4E00',
                                                    duration: 20,
                                                    label: 'label3',
                                                    type: 'client'
                                            },
                                            profiles: [
                                            {
                                                id: docs_crossings[0].crossings[index_docs_crossings].crossing_user.user_id,
                                                mode: 0,
                                                url: docs_crossings[0].crossings[index_docs_crossings].crossing_user.facebook_picture,
                                                width: 50,
                                                height: 50
                                            }]
                                         }
                                      };
					
				      for (var index_docs_feedbacks = 0, len_docs_feedbacks = docs_crossings[0].crossings[index_docs_crossings].crossing_feedback.length; index_docs_feedbacks < len_docs_feedbacks; index_docs_feedbacks++) {

					    var item_crossings_feedback = {
						matching: docs_crossings[0].crossings[index_docs_crossings].crossing_feedback[index_docs_feedbacks].matching,
						working: docs_crossings[0].crossings[index_docs_crossings].crossing_feedback[index_docs_feedbacks].working,
						type: docs_crossings[0].crossings[index_docs_crossings].crossing_feedback[index_docs_feedbacks].type,
						name: docs_crossings[0].crossings[index_docs_crossings].crossing_feedback[index_docs_feedbacks].name,
						payment: docs_crossings[0].crossings[index_docs_crossings].crossing_feedback[index_docs_feedbacks].payment,
						evaluation: docs_crossings[0].crossings[index_docs_crossings].crossing_feedback[index_docs_feedbacks].evaluation
					    };

					    item_crossings.notifier.service_feedback_preferences.feedbacks.push(item_crossings_feedback); 
				      } 

				      result.data.push(item_crossings);
	
				      //feedback crossing item by user
				      /*db.collection('feedback_preferences').aggregate([
					  {$match: {$or: [{matching:parseInt(item_crossings.notifier.id)}, {working:parseInt(item_crossings.notifier.id)}]} }]).toArray(function (err, docs_feedbacks) {

					    if (docs_feedbacks.length > 0) {

						for (var index_docs_feedbacks = 0, len_docs_feedbacks = docs_feedbacks.length; index_docs_feedbacks < len_docs_feedbacks; index_docs_feedbacks++) {

						    var item_crossings_feedback = {
							matching: docs_feedbacks[index_docs_feedbacks].matching,                            
							working: docs_feedbacks[index_docs_feedbacks].working,
							type: docs_feedbacks[index_docs_feedbacks].type,
							name: docs_feedbacks[index_docs_feedbacks].name,
							evaluation: docs_feedbacks[index_docs_feedbacks].evaluation
						    };

						    item_crossings.notifier.service_feedback_preferences.feedbacks.push(item_crossings_feedback); 
						}
					    }

					    					      
				      });
					
				      //last meet position crossing
				      db.collection('crossings_positions').aggregate([            
					{$unwind:'$crossings'},            
					{$match:{$and:[{'user_id' : parseInt(req.params.user_id), 'crossings' : parseInt(item_crossings.notifier.id)}]} },
					{$group:{_id:'$user_id', lat: { $last: '$lat' }, lon: { $last: '$lon' }, date: { $last: '$timestamp' }, crossings:{'$addToSet':'$crossings'} } }]).toArray(function (err, docs_last_meet) {

					    if (docs_last_meet.length > 0) {

						for (var index_docs_last_meet = 0, len_docs_last_meet = docs_last_meet.length; index_docs_last_meet < len_docs_last_meet; index_docs_last_meet++) {

						    item_crossings.notifier.last_meet_position = {
							creation_date: docs_last_meet[index_docs_last_meet].date.toISOString().split('T')[0],
							lat: docs_last_meet[index_docs_last_meet].lat,
							lon: docs_last_meet[index_docs_last_meet].lon
						    };

						    break;
						}
					    }

					    //res.json(result);
				      });*/
                                }
                            }
				
			    res.json(result);
                        }
                    });
                } 
        });
    }     
});

app.get('/api/users/:user_id/notifications', function (req, res) {
    
    /*
    if(!req.body.service_notification_preferences) {
        res.status(400).send('400 Bad Request')
    }
  
    console.log('req.body.service_notification_preferences --> ' + req.body.service_notification_preferences);
    
    var date = new Date();
    date.setHours(date.getHours() - 3);
    var timestampISODate = new Date(date.toISOString());
  
    db.collection('notification_preferences').insert({
        user_id : parseInt(req.params.user_id),
        timestamp : timestampISODate,
        notification : req.body.service_notification_preferences.notification
    });
         
    var result = {
        success: true,
        data: {               
            id: req.params.user_id, 	
            service_notification_preferences: req.body.service_notification_preferences
        }
    };
    */
    
  var result =  {
           success: true,
           data: [{
              id: req.params.user_id,              
              modification_date: '2017-07-20',
              is_notified: false,
              type: '471',
	      message_title: 'Bem-vindo ao TaskHunter',
	      message_data: 'Vamos lá!',
              nb_times: 0,
              notification_type: '471,524,525,526,529,530,531,565,791,792',
              notifier: { 
                  id: 30, 
                  type: 'type',
                  first_name: '',
                  gender: 'M',
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
                      
                      width: 50,
                      height: 50
                  }]
              }
          },
	  {
	      id: req.params.user_id,              
	      modification_date: '2017-07-20',
	      is_notified: false,
	      type: '471',
	      message_title: 'Serviços',
	      message_data: 'Marque no menu os serviços que você procura ou executa profissionalmente',
	      nb_times: 0,
	      notification_type: '471,524,525,526,529,530,531,565,791,792',
	      notifier: { 
		  id: 30, 
		  type: 'type',
		  first_name: '',
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
		      
		      width: 50,
		      height: 50
		  }]
	      }
	  },
	  {
	      id: req.params.user_id,              
	      modification_date: '2017-07-20',
	      is_notified: false,
	      type: '471',
	      message_title: 'Acompanhe sua Timeline',
	      message_data: 'Ande por aí para cruzar com clientes e profissionais',
	      nb_times: 0,
	      notification_type: '471,524,525,526,529,530,531,565,791,792',
	      notifier: { 
		  id: 30, 
		  type: 'type',
		  first_name: '',
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
		      
		      width: 50,
		      height: 50
		  }]
	      }
	  },
	  {
	      id: req.params.user_id,              
	      modification_date: '2017-07-20',
	      is_notified: false,
	      type: '471',
	      message_title: 'Faça Negócios',
	      message_data: 'Com quem cruza o seu caminho',
	      nb_times: 0,
	      notification_type: '471,524,525,526,529,530,531,565,791,792',
	      notifier: { 
		  id: 30, 
		  type: 'type',
		  first_name: '',
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
		      
		      width: 50,
		      height: 50
		  }]
	      }
	  },
	  {
	      id: req.params.user_id,              
	      modification_date: '2017-07-20',
	      is_notified: false,
	      type: '471',
	      message_title: 'Pagamento',
	      message_data: 'Pague pelo serviço direto no aplicativo podendo parcelar em até 5x',
	      nb_times: 0,
	      notification_type: '471,524,525,526,529,530,531,565,791,792',
	      notifier: { 
		  id: 30, 
		  type: 'type',
		  first_name: '',
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
		      
		      width: 50,
		      height: 50
		  }]
	      }
	  },
	  {
	      id: req.params.user_id,              
	      modification_date: '2017-07-20',
	      is_notified: false,
	      type: '471',
	      message_title: 'Endereço para Pagamento',
	      message_data: 'Para pagamento no aplicativo você precisa informar seu endereço editando seu perfil no menu',
	      nb_times: 0,
	      notification_type: '471,524,525,526,529,530,531,565,791,792',
	      notifier: { 
		  id: 30, 
		  type: 'type',
		  first_name: '',
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
		      
		      width: 50,
		      height: 50
		  }]
	      }
	  },
	  {
	      id: req.params.user_id,              
	      modification_date: '2017-07-20',
	      is_notified: false,
	      type: '471',
	      message_title: 'Recebendo pelo Serviço',
	      message_data: 'Para receber por um serviço prestado é necessário informar sua conta bancária editando seu perfil no menu',
	      nb_times: 0,
	      notification_type: '471,524,525,526,529,530,531,565,791,792',
	      notifier: { 
		  id: 30, 
		  type: 'type',
		  first_name: '',
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
		      
		      width: 50,
		      height: 50
		  }]
	      }
	  },
	  {
	      id: req.params.user_id,              
	      modification_date: '2017-07-20',
	      is_notified: false,
	      type: '471',
	      message_title: 'Cartão de Crédito',
	      message_data: 'Não armazenamos seus dados de cartão de crédito no aplicativo, necessitando ser informados a cada pagamento',
	      nb_times: 0,
	      notification_type: '471,524,525,526,529,530,531,565,791,792',
	      notifier: { 
		  id: 30, 
		  type: 'type',
		  first_name: '',
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
                                   
                    //console.log("docs_conversations: " + docs_conversations);

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
            
            //console.log("recipient enviado: " + recipient[1]);
            
            //get conversation by recipient
            //get all user_id conversations
            db.collection('conversations').aggregate([
                {$unwind:'$participants'}, 
                {$lookup: {from: 'users', localField:'participants.user_id', foreignField:'user_id', as:'participantsObjects'}}, 
                {$unwind: '$participantsObjects'}, 
                {$group: {_id:'$_id', participants: {'$push':'$participantsObjects'} }},
                {$match: {$and: [{'participants.user_id':parseInt(req.params.user_id)}, {'participants.user_id':parseInt(recipient[1])}]} }]).toArray(function (err, docs_conversations_recipient) {
                
                    //console.log("docs_conversations_recipient: " + docs_conversations_recipient.length);

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

                                //console.log("docs_conversations_inserted: " + docs_conversations_inserted.length);

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
                
                //console.log("-----> docs_positions.length: " + docs_positions.length);
                //console.log("-----> docs_positions[0]: " + docs_positions[0]);
                //console.log("-----> docs_positions.crossings: " + docs_positions.crossings);
                //console.log("-----> docs_positions.crossings.length: " + docs_positions[0].crossings.length);
                
                db.collection('crossings').insert({
                    user_id:parseInt(req.params.user_id),
                    timestamp:timestampISODate,		    
                    crossings: docs_positions[0].crossings
                });
		    
		db.collection('crossings_positions').insert({
                    user_id:parseInt(req.params.user_id),
                    timestamp:timestampISODate,
		    lat: parseFloat(req.body.latitude),
		    lon: parseFloat(req.body.longitude),
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

//last meet position crossing
app.get('/api/positions/:user_id/lastmeetposition/:crossing_user_id', function (req, res) {
	
    if (!db) {
      initDb(function(err){});
    }
	
    if (db) {
  
    var result = {
        success: true,
        data: {}
    };
	
    db.collection('crossings_positions').aggregate([            
	{$unwind:'$crossings'},            
	{$match:{$and:[{'user_id' : parseInt(req.params.user_id), 'crossings' : parseInt(req.params.crossing_user_id)}]} },
	{$group:{_id:'$user_id', lat: { $last: '$lat' }, lon: { $last: '$lon' }, date: { $last: '$timestamp' }, crossings:{'$addToSet':'$crossings'} } }]).toArray(function (err, docs_last_meet) {
	    if (docs_last_meet.length > 0) {
		for (var index_docs_last_meet = 0, len_docs_last_meet = docs_last_meet.length; index_docs_last_meet < len_docs_last_meet; index_docs_last_meet++) {
		    var last_meet_position = {
			creation_date: docs_last_meet[index_docs_last_meet].date.toISOString().split('T')[0],
			lat: docs_last_meet[index_docs_last_meet].lat,
			lon: docs_last_meet[index_docs_last_meet].lon
		    };
		    result.data = last_meet_position;
		}
	    }
	    
	    res.json(result);
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
        user_id: parseInt(req.params.user_id)
    };

    db.collection('devices').find(query).toArray(function (err, docs) {
        
        var result = {
              success: true,
              data: {}
        };

        //console.log(req.params.user_id + " docs: " + docs.length);
        
        if (docs.length <= 0) {
            var col = db.collection('devices');
            //col.insert({position: req.body.name, date: Date.now()});
            //var point = {"type" : "Point", "coordinates" : [req.body.lat, req.body.lon]};
            col.insert(
                {
                    user_id: parseInt(req.params.user_id), 
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
        
            /*var result =  {
                 success: true,
                 data: {
                     id: req.params.user_id + '_' + req.body.android_id
                 }
            };*/
		
	    result.data = {
	        id: req.params.user_id + '_' + req.body.android_id
	    };
		
        } else {
	    result.data = {
	        id: docs[0].device.device_id
	    };
	}
	
	return res.json(result);
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
        user_id: parseInt(req.params.user_id)
    };

    db.collection('devices').find(query).toArray(function (err, docs) {
        
        var result = {
              success: true,
              data: {}
        };

        //console.log(req.params.user_id + " docs: " + docs.length);
        
        if (docs.length <= 0) {
            var col = db.collection('devices');
            //col.insert({position: req.body.name, date: Date.now()});
            //var point = {"type" : "Point", "coordinates" : [req.body.lat, req.body.lon]};
            col.insert(
                {
                    user_id: parseInt(req.params.user_id),
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
        
            /*var result =  {
                 success: true,
                 data: {
                     id: req.params.device_id
                 }
            };*/
		
	    result.data = {
	        id: req.params.device_id
	    };
            
        } else {
	    result.data = {
	        id: docs[0].device.device_id
	    };
	}
	    
	return res.json(result);
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
