var express = require('express');
var router = express.Router();

router.get('/userlist', function(req, res) {
    /*var db = req.db;
    var collection = db.collection('feedback_preferences');
    collection.find({},function(e,docs){
        res.json(docs);
    });*/
    
    var db = req.db;
    var query = {};    

    db.collection('feedback_preferences').find(query).toArray(function (err, docs) {                                   
            return res.json(docs);                
    });
});

router.get('/detailUser/:id', function(req, res) {    
    var db = req.db;
    var ObjectId = require('mongodb').ObjectID;
    var userObjectId = ObjectId(req.params.id);
	
    db.collection('feedback_preferences').find({'_id' : userObjectId}).toArray(function (err, docs_users) {
		return res.json(docs_users);
	});
});

router.post('/updateUser/:id', function(req, res) {
    var db = req.db;
    var ObjectId = require('mongodb').ObjectID;
    var userObjectId = ObjectId(req.params.id);
    var isBlocked = req.body.is_blocked == "true" ? true : false;
	
    db.collection('feedback_preferences').update(
	   {_id : userObjectId}, 
	   {$set: { discount_rate : req.body.discount_rate, is_blocked : isBlocked }},
	   {upsert:false},
	   function (err, result) {
	      res.send(
		  (err === null) ? { msg: '' } : { msg: err }
	      );
	   });
});

module.exports = router;
