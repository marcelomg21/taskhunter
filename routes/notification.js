var express = require('express');
var router = express.Router();

router.get('/notificationlist/:user_id', function(req, res) {
    var db = req.db;
    var query = { user_id : parseInt(req.params.user_id) };

    db.collection('notification_preferences').find(query).toArray(function (err, docs) {                                   
            return res.json(docs);                
    });
});

router.post('/addnotification', function(req, res) {
	
    /*app.put('/api/users/:user_id/notifications', function (req, res) {

	    if(!req.body.service_notification_preferences) {
		res.status(400).send('400 Bad Request')
	    }

	    var date = new Date();
	    date.setHours(date.getHours() - 3);
	    var dateFormat = date.toISOString().split('T')[0];

	    db.collection('notification_preferences').insert({
		user_id : parseInt(req.params.user_id),
		timestamp : dateFormat,
		is_notified : req.body.service_notification_preferences.is_notified,
		message_title : req.body.service_notification_preferences.message_title,
		message_data: req.body.service_notification_preferences.message_data
	    });

	    var result = {
		success: true,
		data: {               
		    id: req.params.user_id, 	
		    service_notification_preferences: req.body.service_notification_preferences
		}
	    };

	    res.json(result);
	});*/
	
    var db = req.db;
    var collection = db.collection('userlist');    
    collection.insert(req.body, function(err, result){
        res.send(
            (err === null) ? { msg: '' } : { msg: err }
        );
    });
});

router.get('/detailnotification/:id', function(req, res) {    
    var db = req.db;
    var ObjectId = require('mongodb').ObjectID;
    var userObjectId = ObjectId(req.params.id);
	
    db.collection('users').find({'_id' : userObjectId}).toArray(function (err, docs_users) {
		return res.json(docs_users);
	});
});

router.post('/updatenotification/:id', function(req, res) {
    var db = req.db;
    var ObjectId = require('mongodb').ObjectID;
    var userObjectId = ObjectId(req.params.id);
	
    db.collection('users').update(
	   {_id : userObjectId}, 
	   {$set: {discount_rate : req.body.discount_rate}}, 
	   {upsert:false},
	   function (err, result) {
	      res.send(
		  (err === null) ? { msg: '' } : { msg: err }
	      );
	   });
});

router.delete('/deletenotification/:id', function(req, res) {
    var db = req.db;
    var collection = db.collection('userlist');
    var userToDelete = req.params.id;
    collection.remove({ '_id' : userToDelete }, function(err) {
        res.send((err === null) ? { msg: '' } : { msg:'error: ' + err });
    });
});

module.exports = router;
