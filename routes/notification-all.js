var express = require('express');
var router = express.Router();

router.get('/notificationalllist', function(req, res) {
    var db = req.db;
    var query = {};    

    db.collection('notification_all_preferences').find(query).toArray(function (err, docs) {                                   
            return res.json(docs);                
    });
});

router.post('/addnotificationall', function(req, res) {
	
    /*app.put('/api/users/notifications/all', function (req, res) {
	    if(!req.body.service_notification_preferences) {
		res.status(400).send('400 Bad Request')
	    }
	    var date = new Date();
	    date.setHours(date.getHours() - 3);
	    var dateFormat = date.toISOString().split('T')[0];
	    db.collection('notification_all_preferences').insert({
		timestamp : dateFormat,
		is_notified : req.body.service_notification_preferences.is_notified,
		message_title : req.body.service_notification_preferences.message_title,
		message_data: req.body.service_notification_preferences.message_data
	    });
	    var result = {
		success: true,
		data: {
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

router.get('/detailnotificationall/:id', function(req, res) {    
    var db = req.db;
    var ObjectId = require('mongodb').ObjectID;
    var notificationAllObjectId = ObjectId(req.params.id);
	
    db.collection('notification_all_preferences').find({'_id' : notificationAllObjectId}).toArray(function (err, docs) {
		return res.json(docs);
	});
});

router.post('/updatenotificationall/:id', function(req, res) {
    var db = req.db;
    var ObjectId = require('mongodb').ObjectID;
    var notificationAllObjectId = ObjectId(req.params.id);
	
    db.collection('notification_all_preferences').update(
	   {_id : notificationAllObjectId}, 
	   {$set: {is_notified : req.body.is_notified,
		  message_title : req.body.message_title,
		  message_data : req.body.message_data} 
	   }, 
	   {upsert:false},
	   function (err, result) {
	      res.send(
		  (err === null) ? { msg: '' } : { msg: err }
	      );
	   });
});

router.delete('/deletenotificationall/:id', function(req, res) {
    var db = req.db;
    var ObjectId = require('mongodb').ObjectID;
    var notificationAllObjectId = ObjectId(req.params.id);

    db.collection('notification_all_preferences').remove({ '_id' : notificationAllObjectId }, function(err) {
        res.send((err === null) ? { msg: '' } : { msg:'error: ' + err });
    });
});

module.exports = router;