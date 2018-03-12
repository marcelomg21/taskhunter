var express = require('express');
var router = express.Router();

router.get('/notificationlist/:user_id', function(req, res) {
    var db = req.db;
    var query = { user_id : parseInt(req.params.user_id) };

    db.collection('notification_preferences').find(query).toArray(function (err, docs) {                                   
            return res.json(docs);                
    });
});

router.get('/notificationalllist', function(req, res) {
    var db = req.db;
    var query = {};    

    db.collection('notification_all_preferences').find(query).toArray(function (err, docs) {                                   
            return res.json(docs);                
    });
});

router.post('/addnotification', function(req, res) {
    var db = req.db;
    var collection = db.collection('userlist');    
    collection.insert(req.body, function(err, result){
        res.send(
            (err === null) ? { msg: '' } : { msg: err }
        );
    });
});

router.post('/addnotificationall', function(req, res) {
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

router.get('/detailnotificationall/:id', function(req, res) {    
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

router.post('/updatenotificationall/:id', function(req, res) {
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

module.exports = router;
